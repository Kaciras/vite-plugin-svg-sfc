<template>
	<header id="hero">
		<h1>vite-svg-sfc</h1>
		<h2>Convert SVG to Vue single file component (SFC)</h2>
		<a class="button" href="https://github.com/Kaciras/vite-plugin-svg-sfc">
			<GitHubIcon/>
			GitHub
		</a>
	</header>
	<section>
		<header>
			<h1>Responsive size and color</h1>
		</header>
		<div class="showcase">
			<form>
				<label>
					color:
					<input type="color" v-model="color">
				</label>
				<label>
					font-size(px):
					<input type="number" min="0" v-model="size">
				</label>
			</form>
			<div class="grid" :style="style">
				<AlarmIcon/><EnvelopeIcon/><SlidersIcon/>
				<AlarmIcon2/><EnvelopeIcon2/><SnowIcon/>
			</div>
		</div>
	</section>
	<section>
		<div class="showcase">

		</div>
		<header>
			<h1>&lt;style&gt; support</h1>
		</header>
	</section>
	<section>
		<header>
			<h1>No </h1>
		</header>
		<div class="showcase">
			<span class="import">?sfc</span>
			<SpringIcon/>

			<img :src="ImportAsset" alt="test">
			<p><span class="import">?url</span>{{ ImportUrl }}</p>

			<span class="import">?raw</span>
			<pre><code>{{ ImportRaw }}</code></pre>
		</div>
	</section>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import GitHubIcon from "bootstrap-icons/icons/github.svg?sfc";

import AlarmIcon from "bootstrap-icons/icons/alarm-fill.svg?sfc";
import AlarmIcon2 from "bootstrap-icons/icons/alarm.svg?sfc";
import EnvelopeIcon from "bootstrap-icons/icons/envelope-paper-heart-fill.svg?sfc";
import EnvelopeIcon2 from "bootstrap-icons/icons/envelope-paper-heart.svg?sfc";
import SlidersIcon from "bootstrap-icons/icons/sliders.svg?sfc";
import SnowIcon from "bootstrap-icons/icons/snow2.svg?sfc";

import SpringIcon from "./assets/logo-spring-framework.svg?sfc";
import ImportAsset from "./assets/logo-spring-framework.svg";
import ImportUrl from "./assets/logo-spring-framework.svg?url";
import ImportRaw from "./assets/logo-spring-framework.svg?raw";

const color = ref("#0aa96d");
const size = ref(48);

const style = computed(() => ({
	color: color.value,
	fontSize: size.value + "px",
}));
</script>

<style>
body {
	margin: 0;
	font-family: sans-serif;
}

h1 {
	margin-top: 0;
}

.button {
	display: inline-flex;
	align-items: center;
	gap: 5px;
	padding: 8px 16px;

	color: #0aa96d;
	border: 1px solid #0aa96d;
	border-radius: 4px;
	outline: none;
	text-decoration: none;
	transition: all .15s;
}

.button:visited {
	color: #0aa96d;
}

.button:hover,
.button:focus-visible {
	color: white;
	background: #0aa96d;
}

.button > svg {
	font-size: 24px;
}

#hero {
	display: flex;
	flex-direction: column;
	align-items: center;
	padding: 30px;
	background: #f7f7f7;
}

section {
	display: flex;
	justify-content: center;
	gap: 8%;
	margin: 0 auto;
	padding: 40px 10px;
}

.showcase {
	width: 36%;
}

form {
	margin-bottom: 40px;
}

.grid {
	display: grid;
	grid-template-rows: repeat(2, auto);
	grid-template-columns: repeat(3, auto);
	gap: 20px;
	justify-content: center;
}

pre {
	padding: 8px;
	height: 20em;
	overflow: scroll;
	background: #f7f7f7;
}

.import {
	padding: 4px;
	background: #f7f7f7;
}
</style>
