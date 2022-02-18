import { readFileSync } from "fs";
import { Plugin as VitePlugin } from "vite";
import { optimize, Plugin } from "svgo";

/**
 * The SVGO plugin used when `svgo.responsive` is true.
 */
export const responsivePlugin: Plugin = {
	name: "responsiveSVGAttribute",
	type: "perItem",
	fn(ast) {
		const { type, name, attributes } = ast;

		if (type === "element" && name === "svg") {
			const { fill, stroke } = attributes;

			if (stroke && stroke !== "none") {
				attributes.stroke = "currentColor";
			}
			if (fill !== "none") {
				attributes.fill = "currentColor";
			}
			attributes.width = attributes.height = "1em";
		}
	},
};

/**
 * Remove all <style> elements and collect their content。
 *
 * @param styles store <style>'s content.
 */
function extractCSSPlugin(styles: string[]) {

	function enter(node: any, parent: any) {
		if (node.name !== "style") {
			return;
		}
		for (const child of node.children) {
			styles.push(child.value);
		}
		parent.children = parent.children
			.filter((c: unknown) => c !== node);
	}

	// @types/svgo not include the new "visitor" type.
	return <any>{
		name: "extractCSS",
		type: "visitor",
		fn: () => ({ element: { enter } }),
	};
}

// Ensure the SVG has single root node.
const essential: Plugin[] = [
	{ name: "removeComments" },
	{ name: "removeDoctype" },
	{ name: "removeXMLProcInst" },
];

const minifyPreset: Plugin = {
	name: "preset-default",
	params: {
		overrides: {
			removeViewBox: false,
		},
	},
};

export interface PluginOptions {

	/**
	 * Perform minification for svg.
	 *
	 * @default true on production mode and false otherwise.
	 */
	minify?: boolean;

	/**
	 * When set to true, some attributes on <svg> will be replaced with reactive value:
	 * 1）set width & height to "1em".
	 * 2）set fill and stroke to "currentColor" if it's not transparent。
	 *
	 * @default true
	 */
	responsive?: boolean;
}

export interface VueSVGOptions {

	/**
	 * When set to true, extract all style elements in the svg and put
	 * their content into a scoped SFC style block.
	 *
	 * Note that Vue compiler will throw error if the template contains <style>.
	 *
	 * @default true
	 */
	extractStyles?: boolean;

	/**
	 * Configure default SVGO plugin preset, or specify the plugins to use.
	 *
	 * @default {}, see PluginOptions
	 */
	svgo?: PluginOptions | Plugin[];
}

/**
 * Convert SVG to Vue SFC, you may need another plugin to process the .vue file。
 */
export default function (options: VueSVGOptions = {}): VitePlugin {
	const { svgo = {}, extractStyles = true } = options;
	let isProd: boolean;

	function svg2sfc(code: string, filename: string) {
		const styles: string[] = [];
		let plugins = svgo;

		if (!Array.isArray(plugins)) {
			const { responsive = true, minify } = plugins;
			plugins = [];

			if (responsive) {
				plugins.push(responsivePlugin);
			}
			if (minify ?? isProd) {
				plugins.push(minifyPreset);
			} else {
				plugins.push(...essential);
			}
		}
		if (extractStyles) {
			plugins.push(extractCSSPlugin(styles));
		}

		const result = optimize(code, {
			plugins,
			path: filename,
		});
		if (result.modernError) {
			throw result.modernError;
		}

		code = `<template>${result.data}</template>`;
		if (styles.length === 0) {
			return code;
		} else {
			const css = styles.join("");
			return `${code}<style scoped>${css}</style>`;
		}
	}

	return {
		name: "vite-plugin-svg-sfc",

		// This plugin must run before vite:asset and other plugins that process .vue files.
		enforce: "pre",

		configResolved(config) {
			isProd = config.mode === "production";
		},

		/**
		 * When a svg file changed, we look for corresponding SFC modules,
		 * if present, add them to affected module list.
		 */
		handleHotUpdate(ctx) {
			const { file, server, modules } = ctx;

			if (file.endsWith(".svg")) {
				const graph = server.moduleGraph;
				const id = file + ".vue";
				const vMods = graph.getModulesByFile(id);
				if (vMods) {
					return [...modules, ...vMods];
				}
			}
		},

		/**
		 * Resolve "*.svg?sfc" import to a virtual .vue file.
		 * e.g. "./image.svg?sfc" -> "/path/to/image.svg.vue?sfc"
		 *
		 * About the suffix:
		 * The `.vue` extension allows other plugins to treat it as a vue file.
		 * Keep the `?sfc` query to prevent vite:scan-deps to process it.
		 */
		async resolveId(id: string, importer: string) {
			if (id.startsWith("/@")) {
				return null;
			}
			let suffix: string;

			if (id.endsWith("svg?sfc")) {
				// Original import (*.svg?sfc)
				id = id.slice(0, -4);
				suffix = ".vue?sfc";
			} else {
				// virtual .vue file (*.svg.vue?sfc)
				// or SFC submodule (*.svg.vue?vue),
				// resolve to absolute path and keep the query.
				const [path, query] = id.split("?", 2);
				if (!path.endsWith(".svg.vue")) {
					return null;
				}
				id = path.slice(0, -4);
				suffix = ".vue";
				if (query) {
					suffix += "?" + query;
				}
			}

			const r = await this.resolve(id, importer, { skipSelf: true });
			if (r) {
				return r.id + suffix;
			}
			throw new Error("Cannot resolve file: " + id);
		},

		load(id: string) {
			if (!id.endsWith(".svg.vue?sfc")) {
				return null;
			}
			const filename = id.slice(0, -8);
			return svg2sfc(readFileSync(filename, "utf8"), filename);
		},
	};
}
