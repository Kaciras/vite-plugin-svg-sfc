import { basename, join } from "path";
import { copyFileSync, mkdirSync, mkdtempSync, rmSync } from "fs";
import { tmpdir } from "os";
import { RollupOutput } from "rollup";
import { build, Plugin, UpdatePayload, ViteDevServer } from "vite";
import { afterEach, beforeEach, expect } from "vitest";
import svgSfc, { SVGSFCPluginOptions } from "../index";

export const extractSFCPlugin: Plugin = {
	name: "test:extract-sfc",
	transform(source: string, id: string) {
		const [path] = id.split("?", 2);
		if (!path.endsWith(".svg.vue")) {
			return;
		}
		this.emitFile({
			type: "asset",
			source,
			fileName: basename(path, ".vue"),
		});
		return "window.avoidWarn = 1";
	},
};

export interface TestOptions {
	mode?: string;
	config?: SVGSFCPluginOptions;
}

export async function compile(fixture: string, options: TestOptions = {}) {
	const { mode, config } = options;

	return <RollupOutput>await build({
		logLevel: "silent",
		mode,
		build: {
			write: false,
			rollupOptions: {
				input: resolveFixture(fixture),

				// Remove hash from file name.
				output: {
					entryFileNames: "[name].js",
					chunkFileNames: "[name].js",
					assetFileNames: "[name].[ext]",
				},
			},
		},
		plugins: [svgSfc(config), extractSFCPlugin],
	});
}

/**
 * Get the asset data with specific file name from Rollup output.
 *
 * Make the test fail if the asset is not exists.
 *
 * @param bundle Rollup output.
 * @param name The file name, query string is ignored.
 */
export function getAsset(bundle: RollupOutput, name: string) {
	[name] = name.split("?", 2);
	const file = bundle.output.find(a => a.fileName === name);

	if (!file) {
		return expect.fail(`${name} is not in the bundle`);
	}
	if (file.type === "asset") {
		return file.source;
	}
	return expect.fail(`${name} is exists but not an asset`);
}

export function convert(fixture: string, options: TestOptions = {}) {
	return compile(fixture, options).then(b => getAsset(b, fixture));
}

export function useTempDirectory(parent = tmpdir()) {
	const root = mkdtempSync(join(parent, "vitest-"));
	beforeEach(() => void mkdirSync(root, { recursive: true }));
	afterEach(() => rmSync(root, { recursive: true }));
	return root;
}

export function resolveFixture(name: string) {
	return join("test/fixtures", name);
}

export function copyFixture(name: string, dist: string) {
	copyFileSync(resolveFixture(name), dist);
}

export class ViteHMRClient {

	private readonly ws: WebSocket;

	constructor(server: ViteDevServer) {
		const { port } = server.config.server;
		this.ws = new WebSocket(`ws://localhost:${port}`, "vite-hmr");
		server.hot.on("close", () => this.ws.close());
	}

	receive(): Promise<UpdatePayload> {
		return new Promise<string>(resolve => this.ws.onmessage = e => resolve(e.data)).then(JSON.parse);
	}
}
