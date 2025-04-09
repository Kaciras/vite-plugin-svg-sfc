import { readFileSync } from "fs";
import { basename } from "path";
import { expect, it } from "vitest";
import { resolveFixture } from "./test-helper.ts";
import { SVGSFCConvertor, SVGSFCOptions } from "../index.ts";

const strokeSVG = readFileSync(resolveFixture("stroke.svg"), "utf8");

function convert(name: string, options?: SVGSFCOptions) {
	const svg = readFileSync(resolveFixture(name), "utf8");
	return new SVGSFCConvertor(options).convert(svg, name);
}

it("should remove processing instructions", () => {
	expect(convert("instruction.svg")).toMatch(/^<template><svg /);
});

it("should remove processing instructions when minify", () => {
	expect(convert("instruction.svg", { minify: true })).toMatch(/^<template><svg /);
});

it("should minify attributes", () => {
	expect(convert("styles-0.svg", { minify: true })).toMatchSnapshot();
});

it("should change the stroke attribute", () => {
	expect(convert("stroke.svg", { minify: true })).toMatchSnapshot();
});

it("should extract styles", () => {
	expect(convert("styles-0.svg"))
		.toContain("<style scoped>#rect { fill: blue; }.st0 { width: 100px; }</style>");
});

it("should convert ids", () => {
	expect(convert("id-links.svg", { uniqueId: true })).toMatchSnapshot();
});

it("should not process SVG if svgo option is false", () => {
	const code = convert("stroke.svg", { svgo: false });
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
	const config: SVGSFCOptions = {
		minify: true,
		svgo: { plugins: ["extractCSS"] },
	};
	return expect(convert("styles-0.svg", config)).toMatchSnapshot();
});

it("should change <svg>'s attributes with svgProps", () => {
	const config: SVGSFCOptions = {
		minify: true,
		svgProps: {
			":data-foo": "1",	// Add new
			viewBox: "0 0 5 5",	// Replace
		},
	};
	expect(convert("styles-0.svg", config)).toMatchSnapshot();
});

it("should change <svg>'s attributes with custom function", () => {
	const config: SVGSFCOptions = {
		minify: true,
		svgProps(attrs, path, passes) {
			attrs.passes = passes;
			attrs.path = basename(path);
		},
	};
	expect(convert("styles-0.svg", config)).toMatchSnapshot();
});
