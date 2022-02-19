import { createRequire } from "module";
import { runInNewContext } from "vm";
import { expect, it } from "vitest";
import { build } from "vite";
import { RollupOutput } from "rollup";
import vue from "@vitejs/plugin-vue";
import { createApp } from "vue";
import { renderToString } from "@vue/server-renderer";
import { extractSFCPlugin, getAsset, resolveFixture } from "./test-utils";
import svgSfc from "../index";

async function convert(fixture: string, mode?: string) {
	const bundle = await build({
		logLevel: "silent",
		mode,
		build: {
			write: false,
			rollupOptions: {
				input: resolveFixture(fixture),
				output: {
					entryFileNames: "[name].js",
					chunkFileNames: "[name].js",
					assetFileNames: "[name].[ext]",
				},
			},
		},
		plugins: [svgSfc(), extractSFCPlugin],
	});
	return getAsset(bundle as RollupOutput, fixture);
}

function loadBundle<T = any>(code: string) {
	const require = createRequire(import.meta.url);
	const context: any = { exports: {}, require };
	runInNewContext(code, context);
	return context.exports.default as T;
}

it("should throw on non-SVG data", async () => {
	const build = convert("png-data.svg?sfc");
	await expect(build).rejects.toThrow();
});

it("should throw on non-exists file", async () => {
	const build = convert("not exists.svg?sfc");
	await expect(build).rejects.toThrow();
});

it("should change attributes", async () => {
	expect(await convert("styles-0.svg?sfc")).toMatchSnapshot();
});

it("should change stroke attribute", async () => {
	expect(await convert("stroke.svg?sfc")).toMatchSnapshot();
});

it("should remove processing instruction in dev", async () => {
	expect(await convert("instruction.svg?sfc"), "development").toMatchSnapshot();
});

it("should remove processing instruction in prod", async () => {
	expect(await convert("instruction.svg?sfc")).toMatchSnapshot();
});

it("should not minify on dev mode", async () => {
	expect(await convert("stroke.svg?sfc", "development")).toMatchSnapshot();
});

it("should extract styles", async () => {
	const source = await convert("styles-0.svg?sfc");
	expect(source.toString()).toMatchSnapshot();
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

	const component = loadBundle(code);
	const app = createApp(component, { width: 4396 });
	expect(await renderToString(app)).toMatchSnapshot();
});
