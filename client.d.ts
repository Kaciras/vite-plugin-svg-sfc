declare module "*.svg?sfc" {
	import { DefineComponent, SVGAttributes } from "vue";
	const component: DefineComponent<SVGAttributes>;
	export default component;
}
