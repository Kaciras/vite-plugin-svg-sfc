import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import svgSfc from "vite-plugin-svg-sfc";

// If in commonjs module
// const { default: svgSfc } = require("vite-plugin-svg-sfc");

export default defineConfig({
	plugins: [svgSfc(), vue()],
});
