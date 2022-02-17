import { basename, join } from "path";
import { copyFileSync, mkdirSync, mkdtempSync, rmSync } from "fs";
import { tmpdir } from "os";
import { RollupOutput } from "rollup";
import { Plugin } from "vite";
import { afterEach, beforeEach, expect } from "vitest";

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

export function useTempDirectory() {
	const root = mkdtempSync(join(tmpdir(), "vitest-"));
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
