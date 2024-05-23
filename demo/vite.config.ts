import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import svgSfc from "../index.ts";

export default defineConfig({
	base: "",
	plugins: [svgSfc(), vue()],
});
