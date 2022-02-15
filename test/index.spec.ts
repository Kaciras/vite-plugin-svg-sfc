import { createRequire } from "module";
import { basename } from "path";
import vm from "vm";
import { expect, it } from "vitest";
import { Plugin } from "vite";
import vue from "@vitejs/plugin-vue";
import { getAsset, runVite } from "./test-utils";
import vueSvgComponent from "../index";
import { createApp } from "vue";
import { renderToString } from "@vue/server-renderer";


const extractCodePlugin: Plugin = {
	name: "test:extract-code",
	transform(code: string, id: string) {
		if (!id.endsWith(".svg.vue?sfc")) {
			return;
		}
		this.emitFile({
			type: "asset",
			name: id,
			fileName: basename(id, ".vue?sfc"),
			source: code,
		});
		return "window.avoidWarn = 1";
	},
};

async function convert(input: string, mode?: string) {
	const bundle = await runVite({
		mode,
		build: {
			rollupOptions: { input },
		},
		plugins: [
			vueSvgComponent(),
			extractCodePlugin,
		],
	});
	return getAsset(bundle, input);
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
	expect(await convert("visible-off.svg?sfc")).toMatchSnapshot();
});

it("should change stroke", async () => {
	expect(await convert("stroke.svg?sfc")).toMatchSnapshot();
});

it("should remove processing instruction in %s", async () => {
	expect(await convert("instruction.svg?sfc")).toMatchSnapshot();
});

it("should extract styles", async () => {
	const source = await convert("inline-styles.svg?sfc");
	expect(source.toString()).toMatchSnapshot();
});


it("should work with @vitejs/plugin-vue", async () => {
	const bundle = await runVite(
		{
			build: {
				ssr: "inline-styles.svg?sfc",
			},
			plugins: [
				vue(),
				vueSvgComponent(),
			],
		},
	);
	const component = loadBundle(bundle.output[0].code).default;
	const app = createApp(component, { width: 4396 });
	expect(await renderToString(app)).toMatchSnapshot();
});
