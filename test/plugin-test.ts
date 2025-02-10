import { cwd } from "process";
import { join, resolve } from "path";
import { writeFileSync } from "fs";
import { expect, it } from "vitest";
import { build, createServer, UpdatePayload } from "vite";
import { RollupOutput } from "rollup";
import vue from "@vitejs/plugin-vue";
import { createApp } from "vue";
import { renderToString } from "vue/server-renderer";
import { compile, convert, copyFixture, createHMRWatcher, resolveFixture, useTempDirectory } from "./test-helper.ts";
import svgSfc from "../index.ts";

const tmpDir = useTempDirectory(cwd());

async function loadBundle<T = any>(code: string) {
	const file = join(tmpDir, "test.js");
	writeFileSync(file, code);
	return (await import("file://" + file)).default as T;
}

it("should throw on non-SVG data", () => {
	return expect(convert("png-data.svg?sfc")).rejects.toThrow(/Could not load/);
});

it("should throw on non-exists file", () => {
	return expect(convert("not exists.svg?sfc")).rejects.toThrow(/Cannot resolve file/);
});

it("should keep query in the URL", async () => {
	const bundle = await compile("stroke.svg?foo=1&sfc&bar");
	const absPath = resolveFixture("stroke.svg");
	expect(bundle.output[0].facadeModuleId).toBe(resolve(absPath) + ".vue?foo=1&sfc&bar");
});

it("should not minify on dev mode", () => {
	return expect(convert("stroke.svg?sfc", { mode: "development" })).resolves.toMatchSnapshot();
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
	const mainUrl = "/image.svg?sfc";
	const styleUrl = `/${filename}.vue?vue&type=style&index=0&scoped=true&lang.css`;

	copyFixture("styles-0.svg", filename);

	const server = await createServer({
		logLevel: "silent",
		root: tmpDir,
		build: {
			rollupOptions: {
				input: "image.svg?sfc",
			},
		},
		plugins: [svgSfc(), vue()],
	});

	async function getStyleCode() {
		await server.transformRequest(mainUrl);
		return (await server.transformRequest(styleUrl))?.code;
	}

	await server.listen();
	const watcher = createHMRWatcher(server);

	expect(await getStyleCode()).contains("fill: blue;");
	copyFixture("styles-1.svg", filename);

	const { updates } = await watcher.waitForNth(2) as UpdatePayload;

	const style = updates.find(e => e.path === styleUrl);
	expect(style?.type).toBe("js-update");
	expect(await getStyleCode()).contains("fill: red;");
});
