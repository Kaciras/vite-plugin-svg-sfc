/// <reference types="vitest" />
import { defineConfig } from "vite";

export default defineConfig({
	test: {
		clearMocks: true,
		coverage: {
			provider: "v8",
			all: false,
			reporter: ["lcov"],
		},
		include: [
			"test/*.spec.ts",
			"test/rollup-test.ts",
		],
	},
});
