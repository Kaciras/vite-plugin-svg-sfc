import { basename, join } from "path";
import { copyFileSync, mkdirSync, mkdtempSync, rmSync } from "fs";
import { tmpdir } from "os";
import { RollupOutput } from "rollup";
import { build, HotPayload, Plugin, ViteDevServer } from "vite";
import { afterEach, beforeEach, expect } from "vitest";
import svgSfc, { SVGSFCPluginOptions } from "../index.ts";

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

export function compile(fixture: string, options: TestOptions = {}) {
	const { mode, config } = options;

	return <Promise<RollupOutput>>build({
		logLevel: "silent",
		mode,
		build: {
			write: false,
			rollupOptions: {
				input: resolveFixture(fixture),

				// Remove hash from file names.
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
	return `test/fixtures/${name}`;
}

export function copyFixture(name: string, dist: string) {
	copyFileSync(resolveFixture(name), dist);
}

export interface TestHMRWatcher {
	events: HotPayload[];
	ws: WebSocket;
	waitForNth(value: number): Promise<HotPayload>;
}

export function createHMRWatcher(server: ViteDevServer) {
	const { port } = server.config.server;
	const ws = new WebSocket(`ws://localhost:${port}`, "vite-hmr");
	const events: HotPayload[] = [];

	server.hot.on("close", () => ws.close());
	ws.addEventListener("message", e => {
		events.push(JSON.parse(e.data));
	});

	function waitForNth(value: number) {
		if (events.length > value) {
			return Promise.resolve(events[value]);
		}
		return new Promise<HotPayload>((resolve, reject) => {
			const handler = () => {
				if (events.length > value) {
					resolve(events[value]);
					ws.removeEventListener("message", handler);
				}
			};
			ws.onerror = reject;
			ws.addEventListener("message", handler);
		});
	}

	return { ws, events, waitForNth } as TestHMRWatcher;
}
