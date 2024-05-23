import { expect, it } from "vitest";
import { convert, resolveFixture, TestOptions } from "./test-helper.ts";
import { SVGSFCConvertor } from "../index.ts";
import { basename } from "path";
import { readFileSync } from "fs";

const strokeSVG = readFileSync(resolveFixture("stroke.svg"), "utf8");

it("should change attributes", async () => {
	expect(await convert("styles-0.svg?sfc")).toMatchSnapshot();
});

it("should change the stroke attribute", async () => {
	expect(await convert("stroke.svg?sfc")).toMatchSnapshot();
});

it("should remove processing instructions in dev", async () => {
	expect(await convert("instruction.svg?sfc", { mode: "development" })).toMatchSnapshot();
});

it("should remove processing instructions in prod", async () => {
	expect(await convert("instruction.svg?sfc")).toMatchSnapshot();
});

it("should extract styles", async () => {
	const code = await convert("styles-0.svg?sfc");
	expect(code.toString()).toMatchSnapshot();
});

it("should not process SVG if svgo option is false", async () => {
	const config = { svgo: false } as const;
	const code = await convert("stroke.svg?sfc", { config });
	expect(code).toBe(`<template>${strokeSVG}</template>`);
});

it("should support configure SVG plugins", () => {
	const convertor = new SVGSFCConvertor({
		svgo: {
			plugins: [
				{ name: "preset-default" },
				{
					name: "modifySVGAttrs",
					params: { foo: 11 },
				},
				{ name: "responsiveSVGAttrs" },
			],
		},
	});
	const resolved = (convertor as any).plugins;
	expect(resolved).toHaveLength(3);
	expect(resolved[0]).toStrictEqual({ name: "preset-default" });
	expect(resolved[1].fn).toBeTypeOf("function");
	expect(resolved[2].fn).toBeTypeOf("function");
});

it("should apply only extractCSS plugin", () => {
	const promise = convert("styles-0.svg?sfc", {
		config: {
			svgo: { plugins: ["extractCSS"] },
		},
	});
	return expect(promise).resolves.toMatchSnapshot();
});

it("should change <svg>'s attributes with svgProps", async () => {
	const config: TestOptions = {
		config: {
			svgProps: {
				":data-foo": "1",	// Add new
				viewBox: "0 0 5 5",	// Replace
			},
		},
	};
	expect(await convert("styles-0.svg?sfc", config)).toMatchSnapshot();
});

it("should change <svg>'s attributes with custom function", async () => {
	const config: TestOptions = {
		config: {
			svgProps(attrs, path, passes) {
				attrs.path = basename(path);
				attrs.passes = passes;
			},
		},
	};
	expect(await convert("styles-0.svg?sfc", config)).toMatchSnapshot();
});
