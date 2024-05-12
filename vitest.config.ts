import { defineConfig } from "vite";

export default defineConfig({
	test: {
		restoreMocks: true,
		coverage: {
			provider: "v8",
			all: false,
			reporter: ["lcovonly"],
		},
		include: [
			"test/*.spec.ts",
			"test/rollup-test.ts",
		],
	},
});
