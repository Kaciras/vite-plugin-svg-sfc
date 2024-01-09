import { readFileSync } from "fs";
import { Plugin as PluginFn, PluginInfo, XastElement } from "svgo/lib/types";
import { Plugin as VitePlugin } from "vite";
import { Config, CustomPlugin, optimize, PluginConfig } from "svgo";

/**
 * Called on each svg root element, modify the attrs in place.
 *
 * @param attrs Attributes of the <svg> element.
 * @param path absolute file path
 * @param passes multipass count
 */
export type ModifySVGProps = (attrs: Record<string, any>, path: string, passes: number) => void;

type SVGPropsParam = Record<string, any> | ModifySVGProps;

function preItem(fn: (node: XastElement, info: PluginInfo) => void): PluginFn<void> {
	return (_, __, info) => ({ element: { enter: node => fn(node, info) } });
}

/**
 * The SVGO plugin used when `responsive` is true.
 */
export const responsiveSVGAttrs: CustomPlugin = {
	name: "responsiveSVGAttrs",
	fn: preItem(node => {
		const { name, attributes } = node;

		if (name === "svg") {
			const { fill, stroke } = attributes;

			if (stroke && stroke !== "none") {
				attributes.stroke = "currentColor";
			}
			if (fill !== "none") {
				attributes.fill = "currentColor";
			}
			attributes.width = attributes.height = "1em";
		}
	}),
};

/**
 * The SVGO plugin for `svgProps` option.
 *
 * SVGO has a addAttributesToSVGElement plugin similar to this,
 * but it cannot override existing attributes.
 *
 * @param params The attributes to add to <svg>
 */
export function setSVGAttrs(params: SVGPropsParam): CustomPlugin {
	const fn = typeof params === "function"
		? params
		: (attrs: any) => Object.assign(attrs, params);

	return {
		name: "setSVGAttrs",
		fn: preItem((node, info) => {
			const { name, attributes } = node;
			const { path, multipassCount } = info;

			if (name === "svg") {
				fn(attributes, path, multipassCount);
			}
		}),
	};
}

/**
 * Remove all <style> elements and collect their content。
 *
 * @param styles store <style>'s content.
 */
export function extractCSS(styles: string[]) {

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

	return <PluginConfig>{
		name: "extractCSS",
		fn: () => ({ element: { enter } }),
	};
}

const essential: PluginConfig[] = [
	// Ensure the SVG component has single root node.
	"removeComments",
	"removeDoctype",
	"removeXMLProcInst",

	setSVGAttrs(attrs => {
		// https://stackoverflow.com/a/34249810
		delete attrs.xmlns;
		delete attrs.version;

		// Deprecated & removed from the standards.
		delete attrs["xml:space"];
	}),
];

type InternalPluginOptions = { name: "extractCSS" }
	| { name: "responsiveSVGAttrs" }
	| { name: "setSVGAttrs"; params?: SVGPropsParam };

type PluginEx = PluginConfig | InternalPluginOptions | InternalPluginOptions["name"]

export interface SVGOptions extends Omit<Config, "plugins"> {
	plugins?: PluginEx[];
}

export interface SVGSFCOptions {

	/**
	 * When set to true, extract all style elements in the svg and put
	 * their content into a scoped SFC style block.
	 *
	 * @default true
	 */
	extractStyles?: boolean;

	/**
	 * Perform minification for SVG.
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

	/**
	 * Modify attributes of the root SVG tag.
	 *
	 * @default undefined
	 */
	svgProps?: SVGPropsParam;

	/**
	 * Specify SVGO config, set to false to disable processing SVG data.
	 *
	 * If `svgo.plugins` is specified, the `extractStyles`, `minify`,
	 * `svgProps` and `responsive` options are ignored, you can add them manually:
	 *
	 * @example
	 * import svgSfc from "vite-plugin-svg-sfc";
	 *
	 * svgSfc({
	 *     svgo: {
	 *         plugins: [
	 *             "responsiveSVGAttrs",
	 *             "extractCSS",
	 *             "preset-default",
	 *             {
	 *                 name: "setSVGAttrs",
	 *                 params: { foo: "bar" }
	 *             }
	 *         ]
	 *     }
	 * });
	 *
	 * @default {}
	 */
	svgo?: SVGOptions | false;
}

export class SVGSFCConvertor {

	private readonly plugins: PluginConfig[] = [];

	/*
	 * It's ok to use shared array between each module,
	 * because SVGO runs synchronously, just empty the array before optimize.
	 */
	private readonly styles: string[] = [];

	private readonly svgo?: SVGOptions | false;

	public constructor(options: SVGSFCOptions = {}) {
		const { svgo = {} } = options;
		this.svgo = svgo;

		// Determine which SVGO plugins to use.
		if (svgo === false) {
			// SVGO optimization disabled.
		} else if (svgo.plugins) {
			this.resolve(svgo.plugins);
		} else {
			this.applyPresets(options);
		}
	}

	private resolve(src: PluginEx[]) {
		const { plugins, styles } = this;

		for (const plugin of src) {
			let name: string;
			let params: any;

			if (typeof plugin === "string") {
				name = plugin;
			} else {
				name = plugin.name;
				params = (plugin as any).params;
			}

			switch (name) {
				case "extractCSS":
					plugins.push(extractCSS(styles));
					break;
				case "responsiveSVGAttrs":
					plugins.push(responsiveSVGAttrs);
					break;
				case "setSVGAttrs":
					plugins.push(setSVGAttrs(params));
					break;
				default:
					plugins.push(plugin as PluginConfig);
			}
		}
	}

	private applyPresets(options: SVGSFCOptions) {
		const { plugins, styles } = this;
		const {
			minify,
			svgProps,
			extractStyles = true,
			responsive = true,
		} = options;

		const overrides: Record<string, boolean> = {
			// Don't remove IDs, it may be referenced from outside.
			cleanupIds: false,
			removeViewBox: false,
		};

		if (responsive) {
			plugins.push(responsiveSVGAttrs);
		}

		if (minify) {
			plugins.push({
				name: "preset-default",
				params: { overrides },
			});
		} else {
			plugins.push(...essential);
		}

		if (svgProps) {
			plugins.push(setSVGAttrs(svgProps));
		}

		if (extractStyles) {
			overrides.inlineStyles = false;
			plugins.push(extractCSS(styles));
		}

		if (minify) {
			// Ensure sortAttrs can handle new attributes added by setSVGAttrs.
			overrides.sortAttrs = false;
			plugins.push("sortAttrs");

			// Move it to after extractCSS since remove <style> may leave empty <defs>.
			overrides.removeUselessDefs = false;
			plugins.push("removeUselessDefs");
		}
	}

	/**
	 * Convert the SVG XML to Vue SFC code.
	 *
	 * @param svg the SVG code.
	 * @param path The path of the SVG file, can be used by plugins.
	 */
	convert(svg: string, path?: string) {
		const { styles, plugins, svgo } = this;
		styles.length = 0;

		if (svgo) {
			svg = optimize(svg, { ...svgo, path, plugins }).data;
		}

		svg = `<template>${svg}</template>`;
		if (styles.length === 0) {
			return svg;
		} else {
			const css = styles.join("");
			return `${svg}<style scoped>${css}</style>`;
		}
	}
}

export interface SVGSFCPluginOptions extends SVGSFCOptions {

	/**
	 * SVG will be imported as SFC using the query parameter.
	 *
	 * @example
	 * // vite.config.js
	 * export default defineConfig({
	 *     plugins: [svgSfc({ mark: "component" }), vue()],
	 * });
	 *
	 * // Vue component.
	 * import Icon from "../assets/my-icon.svg?component";
	 *
	 * @default "sfc"
	 */
	mark?: string;
}

function parseRequest(id: string): [string, URLSearchParams, string] {
	const [path, query] = id.split("?", 2);
	return [path, new URLSearchParams(query), query];
}

/**
 * Convert SVG to Vue SFC, you need another plugin to process the .vue file。
 */
export default function (options: SVGSFCPluginOptions = {}): VitePlugin {
	const { mark = "sfc" } = options;
	let svg2sfc: SVGSFCConvertor;

	return {
		name: "vite-plugin-svg-sfc",

		// This plugin must run before vite:asset and other plugins that process .vue files.
		enforce: "pre",

		configResolved({ mode }) {
			const minify = mode === "production";
			svg2sfc = new SVGSFCConvertor({ minify, ...options });
		},

		/**
		 * For Rollup compatibility. This hook is called after configResolved().
		 */
		buildStart() {
			svg2sfc ??= new SVGSFCConvertor(options);
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
		 * The `.vue` extension makes other plugins treat it as a vue file.
		 * Keep the `?sfc` query to prevent vite:dep-scan to process it.
		 */
		async resolveId(id: string, importer?: string) {
			if (id.startsWith("/@")) {
				return null;
			}
			const [path, params, query] = parseRequest(id);

			if (path.endsWith(".svg") && params.has(mark)) {
				// Original import (*.svg?sfc)
				id = path;
			} else {
				// virtual .vue file (*.svg.vue?sfc)
				// or SFC submodule (*.svg.vue?vue).
				if (!path.endsWith(".svg.vue")) {
					return null;
				}
				id = path.slice(0, -4);
			}

			const r = await this.resolve(id, importer);
			if (!r) {
				throw new Error("Cannot resolve file: " + id);
			}
			return query ? `${r.id}.vue?${query}` : `${r.id}.vue`;
		},

		load(id: string) {
			const [vPath, params] = parseRequest(id);
			if (vPath.endsWith(".svg.vue") && params.has(mark)) {
				const path = vPath.slice(0, -4);
				return svg2sfc.convert(readFileSync(path, "utf8"), path);
			}
		},
	};
}
