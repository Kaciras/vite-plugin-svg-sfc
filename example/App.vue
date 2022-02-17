<template>
	<header>
		<h1>vite-svg-sfc</h1>
		<h2>Convert SVGs to Vue single file component(SFC)</h2>
	</header>
	<section>
		<label>
			font-size:
			<input type="color" v-model="color">
		</label>
		<label>
			color:
			<input type="number" min="0" v-model="size">
		</label>
	</section>
	<section :style="style">
		<AlarmIcon/><SpringIcon/>
	</section>
	<section>
		<img :src="SpringIconUrl" alt="test">
	</section>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import AlarmIcon from "bootstrap-icons/icons/alarm.svg?sfc";
import SpringIcon from "./assets/logo-spring-framework.svg?sfc";
import SpringIconUrl from "./assets/logo-spring-framework.svg";

const color = ref("#000");
const size = ref(24);

const style = computed(() => ({
	color: color.value,
	fontSize: size.value + "px",
}));
</script>

<style>
body {
	margin: 1px;
	font-family: sans-serif;
}
</style>
