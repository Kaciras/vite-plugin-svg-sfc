import { cwd } from "process";
import { join, resolve } from "path";
import { writeFileSync } from "fs";
import { expect, it } from "vitest";
import { build, createServer } from "vite";
import { RollupOutput } from "rollup";
import vue from "@vitejs/plugin-vue";
import { createApp } from "vue";
import { renderToString } from "vue/server-renderer";
import { compile, convert, copyFixture, createHMRClient, resolveFixture, useTempDirectory } from "./test-helper.ts";
import svgSfc from "../index.ts";

const input = "image.svg";
const tmpDir = useTempDirectory(cwd());

async function loadBundle<T = any>(code: string) {
	const file = join(tmpDir, "test.js");
	writeFileSync(file, code);
	return (await import("file://" + file)).default as T;
}

it("should throw on non-SVG data", async () => {
	const build = convert("png-data.svg?sfc");
	await expect(build).rejects.toThrow();
});

it("should throw on non-exists file", async () => {
	const build = convert("not exists.svg?sfc");
	await expect(build).rejects.toThrow();
});

it("should keep query in the URL", async () => {
	const bundle = await compile("stroke.svg?foo=1&sfc&bar");
	const absPath = resolveFixture("stroke.svg").replaceAll("\\", "/");
	expect(bundle.output[0].facadeModuleId)
		.toBe(resolve(absPath) + ".vue?foo=1&sfc&bar");
});

it("should not minify on dev mode", async () => {
	expect(await convert("stroke.svg?sfc", { mode: "development" })).toMatchSnapshot();
});

it("should support set minify in options", async () => {
	const code = await convert("stroke.svg?sfc", {
		mode: "production",
		config: { minify: false },
	});
	expect(code).toMatch("<title>Untitled-1</title>");
});

it("should support custom mark", async () => {
	const code = await convert("styles-0.svg?component", {
		config: { mark: "component" },
	});
	expect(code).toMatchSnapshot();
});

it("should work with @vitejs/plugin-vue", async () => {
	const bundle = await build({
		logLevel: "silent",
		build: {
			write: false,
			ssr: resolveFixture("styles-0.svg?sfc"),
		},
		plugins: [vue(), svgSfc()],
	});
	const { code } = (bundle as RollupOutput).output[0];

	const component = await loadBundle(code);
	const app = createApp(component, { width: 4396 });
	expect(await renderToString(app)).toMatchSnapshot();
});

it("should support HMR", async () => {
	const filename = join(tmpDir, "image.svg");
	const mainUrl = `/${input}?sfc`;
	const styleUrl = `/${filename}.vue?vue&type=style&index=0&scoped=true&lang.css`;

	copyFixture("styles-0.svg", filename);

	const server = await createServer({
		logLevel: "silent",
		root: tmpDir,
		build: {
			rollupOptions: {
				input: input + "?sfc",
			},
		},
		plugins: [svgSfc(), vue()],
	});

	async function getStyleCode() {
		await server.transformRequest(mainUrl);
		return (await server.transformRequest(styleUrl))?.code;
	}

	await server.listen();
	const receiveUpdate = createHMRClient(server);

	expect(await getStyleCode()).contains("fill: blue;");

	const waitForHMR = receiveUpdate();
	copyFixture("styles-1.svg", filename);
	const { updates } = await waitForHMR;

	const style = updates.find(e => e.path === styleUrl);
	expect(style?.type).toBe("js-update");
	expect(await getStyleCode()).contains("fill: red;");
});
