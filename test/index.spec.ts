import { createRequire } from "module";
import vm from "vm";
import { expect, it } from "vitest";
import vue from "@vitejs/plugin-vue";
import { extractSFCPlugin, getAsset, resolveFixture } from "./test-utils";
import vueSvgComponent from "../index";
import { createApp } from "vue";
import { renderToString } from "@vue/server-renderer";
import { build } from "vite";
import { RollupOutput } from "rollup";

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
		plugins: [
			vueSvgComponent(),
			extractSFCPlugin,
		],
	});
	return getAsset(bundle as RollupOutput, fixture);
}

function loadBundle<T = any>(code: string) {
	const require = createRequire(import.meta.url);
	const context = { exports: {}, require };
	vm.runInNewContext(code, context, { filename: "test.cjs" });
	return context.exports as T;
}

it("should throw on non-SVG data", async () => {
	const build = convert("png-data.svg?sfc");
	await expect(build).rejects.toThrow();
});

it("should change attributes in %s", async () => {
	expect(await convert("styles-0.svg?sfc")).toMatchSnapshot();
});

it("should change stroke", async () => {
	expect(await convert("stroke.svg?sfc")).toMatchSnapshot();
});

it("should remove processing instruction in %s", async () => {
	expect(await convert("instruction.svg?sfc")).toMatchSnapshot();
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
		plugins: [
			vue(),
			vueSvgComponent(),
		],
	});
	const { code } = (bundle as RollupOutput).output[0];

	const component = loadBundle(code).default;
	const app = createApp(component, { width: 4396 });
	expect(await renderToString(app)).toMatchSnapshot();
});
