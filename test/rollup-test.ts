import { expect, it } from "vitest";
import { OutputAsset, OutputChunk, rollup } from "rollup";
import { extractSFCPlugin, resolveFixture } from "./test-utils.ts";
import svgSfc from "../index.ts";

it("should work with rollup", async () => {
	const build = await rollup({
		input: resolveFixture("instruction.svg?sfc"),
		plugins: [svgSfc(), extractSFCPlugin],
	});
	const result = await build.generate({});

	const [chunk, asset] = result.output;
	expect((asset as OutputAsset).source).toMatchSnapshot();
	expect((chunk as OutputChunk).facadeModuleId).toMatch(/\.svg\.vue\?sfc/);
});
