import { readFileSync } from "fs";
import { Plugin as VitePlugin } from "vite";
import { optimize, OptimizeOptions, Plugin } from "svgo";

type SvgProps = Record<string, string>;

/**
 * The SVGO plugin used when `responsive` is true.
 */
export const responsiveSVGAttrs: Plugin = {
	name: "responsiveSVGAttrs",
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
 * The SVGO plugin for `svgProps` option.
 *
 * SVGO has a addAttributesToSVGElement plugin similar to this,
 * it cannot override existing attributes.
 *
 * @param props The attributes to add to <svg>
 */
export function setSVGAttrs(props: SvgProps): Plugin {
	return {
		name: "setSVGAttrs",
		type: "perItem",
		fn(ast) {
			const { type, name, attributes } = ast;
			if (type === "element" && name === "svg") {
				Object.assign(attributes, props);
			}
		},
	};
}

/**
 * The SVGO plugin used when `extractStyles` is true.
 */
export const extractStyles: Plugin = {
	name: "extractCSS",
	type: "perItem",
	fn() {
		throw new Error("This plugin is a placeholder and will be replaced with `extractCSS()`, " +
			"it cannot be used outside vite-plugin-svg-sfc.");
	},
};

/**
 * Remove all <style> elements and collect their content。
 *
 * @param styles store <style>'s content.
 */
function extractCSS(styles: string[]) {

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

	// @types/svgo does not include the new "visitor" type.
	return <Plugin>{
		name: "extractCSS",
		type: "visitor",
		fn: () => ({ element: { enter } }),
	};
}

// Ensure the SVG has single root node.
const essential: Plugin[] = [
	"removeComments",
	"removeDoctype",
	"removeXMLProcInst",
];

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
	 * Add props to the root SVG tag.
	 *
	 * @default undefined
	 */
	svgProps?: SvgProps;

	/**
	 * Specify SVGO config, set to false to disable processing SVG data.
	 *
	 * If `svgo.plugins` is specified, the `extractStyles`, `minify`,
	 * `svgProps` and `responsive` options are ignored, you can add them manually:
	 *
	 * @example
	 * import svgSfc, {
	 * 		responsiveSVGAttrs,
	 *	 	setSVGAttrs,
	 * 		extractStyles,
	 * } from "vite-plugin-svg-sfc";
	 *
	 * svgSfc({
	 *     svgo: {
	 *         plugins: [
	 *             responsiveSVGAttrs,
	 *             setSVGAttrs({ foo: "bar" }),
	 *             "preset-default",
	 *             extractStyles,
	 *         ]
	 *     }
	 * });
	 *
	 * @default {}
	 */
	svgo?: OptimizeOptions | false;
}

/**
 * Convert SVG to Vue SFC, you may need another plugin to process the .vue file。
 */
export default function (options: SVGSFCOptions = {}): VitePlugin {
	const { svgo = {} } = options;
	const plugins: Plugin[] = [];

	// It's ok to use shared array between each module,
	// because SVGO runs synchronously, just empty the array before optimize.
	const styles: string[] = [];

	function applyPresets(isProd: boolean) {
		const {
			minify = isProd,
			svgProps,
			extractStyles = true,
			responsive = true,
		} = options;

		const overrides: Record<string, boolean> = {
			// Don't remove ID, as it may be referenced from outside.
			cleanupIDs: false,
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
			// Move it after extractCSS.
			overrides.removeUselessDefs = false;
			plugins.push("removeUselessDefs");
		}
	}

	function svg2sfc(code: string, path: string) {
		styles.length = 0;

		if (svgo) {
			const result = optimize(code, {
				...svgo,
				path,
				plugins,
			});
			if (!result.modernError) {
				code = result.data;
			} else {
				throw result.modernError;
			}
		}

		code = `<template>${code}</template>`;
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

		/**
		 * Determine which SVGO plugins to use.
		 */
		configResolved({ isProduction }) {
			if (svgo === false) {
				return;
			}
			if (svgo.plugins) {
				plugins.push(...svgo.plugins);
				const i = plugins.indexOf(extractStyles);
				if (i >= 0) {
					plugins[i] = extractCSS(styles);
				}
			} else {
				applyPresets(isProduction);
			}
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
			if (id.endsWith(".svg.vue?sfc")) {
				const path = id.slice(0, -8);
				return svg2sfc(readFileSync(path, "utf8"), path);
			}
		},
	};
}
