import { readFileSync } from "fs";
import { Plugin as VitePlugin } from "vite";
import { optimize, Plugin } from "svgo";


const reactiveColorPlugin: Plugin = {
	name: "reactiveSVGAttribute",
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


function extractStyles(styles: string[]): any {

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

	return {
		name: "collectStyles",
		type: "visitor",
		fn: () => ({ element: { enter } }),
	};
}

export const minifyPreset: Plugin = {
	name: "preset-default",
	params: {
		overrides: {
			removeViewBox: false,
		},
	},
};


const developmentPlugins: Plugin[] = [
	reactiveColorPlugin,
	{ name: "removeComments" },
	{ name: "removeDoctype" },
	{ name: "removeXMLProcInst" },
];

const productionPlugins: Plugin[] = [
	reactiveColorPlugin,
	minifyPreset,
];

export interface PluginConfig {
	reactive?: boolean;
	minify?: boolean;
	extractStyle?: boolean;
}

export interface VueSVGOptions {
	plugins?: Plugin[] | PluginConfig;
}

function parseId(id: string) {
	const [file, query] = id.split("?", 2);
	return {
		file, query,
		params: new URLSearchParams(query),
	};
}

export default function (optoins?: VueSVGOptions): VitePlugin {
	let minify: boolean;

	function svg2sfc(code: string) {
		const styles: string[] = [];
		const plugins = [
			...(minify ? productionPlugins : developmentPlugins),
			extractStyles(styles),
		];

		const result = optimize(code, { plugins });
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
		name: "kaciras:vue-svg-component",

		// 本插件必须在 vite:asset 以及其它处理 .vue 文件的插件之前执行。
		enforce: "pre",

		configResolved(config) {
			minify = config.mode === "production";
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

		async resolveId(id: string, importer: string) {
			if (id.startsWith("/@")) {
				return null;
			}
			const { file, query, params } = parseId(id);
			let suffix: string;

			if (file.endsWith(".svg") && params.has("sfc")) {
				suffix = ".vue?sfc";
				id = file;
			} else if (file.endsWith(".svg.vue") && (params.has("sfc") || params.has("vue"))) {
				id = file.slice(0, -4);
				suffix = ".vue?" + query;
			} else {
				return null;
			}

			const r = await this.resolve(id, importer, { skipSelf: true });
			if (r) {
				const cc = r.id + suffix;
				fileIdMap.set(r.id, r.id + ".vue");
				return cc;
			}
			throw new Error("Cannot resolve file: " + id);
		},

		load(id: string) {
			if (!id.endsWith(".svg.vue?sfc")) {
				return null;
			}
			return svg2sfc(readFileSync(id.slice(0, -8), "utf8"));
		},
	};
}
