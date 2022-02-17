import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import svgSfc from "vite-svg-sfc";

export default defineConfig({
	base: "",
	plugins: [svgSfc(), vue()],
});
