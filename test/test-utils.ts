import { basename, dirname, join } from "path";
import { fileURLToPath } from "url";
import { copyFileSync, mkdirSync, mkdtempSync, rmSync } from "fs";
import { tmpdir } from "os";
import { RollupOutput } from "rollup";
import WebSocket from "ws";
import { build, Plugin, UpdatePayload, ViteDevServer } from "vite";
import { afterEach, beforeEach, expect } from "vitest";
import svgSfc, { SVGSFCOptions } from "../index";

const __dirname = dirname(fileURLToPath(import.meta.url));

export const extractSFCPlugin: Plugin = {
	name: "test:extract-sfc",
	transform(source: string, id: string) {
		if (!id.endsWith(".svg.vue?sfc")) {
			return;
		}
		this.emitFile({
			type: "asset",
			source,
			fileName: basename(id, ".vue?sfc"),
		});
		return "window.avoidWarn = 1";
	},
};

export interface TestOptions {
	mode?: string;
	config?: SVGSFCOptions;
}

export async function convert(fixture: string, options: TestOptions = {}) {
	const { mode, config } = options;

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
		plugins: [svgSfc(config), extractSFCPlugin],
	});

	return getAsset(bundle as RollupOutput, fixture);
}

export function getAsset(bundle: RollupOutput, name: string) {
	name = name.split("?", 2)[0];
	const file = bundle.output.find(a => a.fileName === name);

	if (!file) {
		return expect.fail(`${name} is not in the bundle`);
	}
	if (file.type === "asset") {
		return file.source;
	}
	return expect.fail(`${name} is exists but not an asset`);
}

export function useTempDirectory(parent = tmpdir()) {
	const root = mkdtempSync(join(parent, "vitest-"));
	beforeEach(() => void mkdirSync(root, { recursive: true }));
	afterEach(() => rmSync(root, { recursive: true }));
	return root;
}

export function resolveFixture(name: string) {
	return join(__dirname, "fixtures", name);
}

export function copyFixture(name: string, dist: string) {
	copyFileSync(resolveFixture(name), dist);
}

export class ViteHMRClient {

	private readonly ws: WebSocket;

	constructor(server: ViteDevServer) {
		const { port } = server.config.server;
		this.ws = new WebSocket(`ws://localhost:${port}`, "vite-hmr");
		server.ws.on("close", () => this.ws.close());
	}

	receive(): Promise<UpdatePayload> {
		return new Promise<string>(resolve => this.ws.once("message", resolve)).then(JSON.parse);
	}
}
