<template>
	<header id="hero">
		<h1>vite-plugin-svg-sfc</h1>
		<p>Convert SVG to Vue single file component (SFC)</p>
		<a class="button" href="https://github.com/Kaciras/vite-plugin-svg-sfc">
			<GitHubIcon/>
			GitHub
		</a>
	</header>
	<div class="usage">
		<h1>Usage</h1>
		<pre class="language-shell"><code>pnpm i -D vite-plugin-svg-sfc</code></pre>
		<pre class="language-js"><code v-html="configCode"></code></pre>
	</div>
	<section>
		<header>
			<h1>Responsive size and color</h1>
			<p></p>
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
			<SpringIcon class="style-demo"/>
		</div>
		<header>
			<h1>&lt;style&gt; support</h1>
			<p>vite-plugin-svg-sfc move &lt;style&gt; tags from SVG to SFC block, you can use</p>
		</header>
	</section>
	<section>
		<header>
			<h1>No </h1>
			<p>vite-plugin-svg-sfc does not affect Vite default asset handling.</p>

			<span class="import">spring.svg?sfc</span>
			<SpringIcon class="import-case"/>

			<span class="import">spring.svg</span>
			<img :src="ImportAsset" alt="test" class="import-case">

			<p><span class="import">spring.svg?url</span>{{ ImportUrl }}</p>
		</header>
		<div class="showcase">
			<span class="import">spring.svg?raw</span>
			<pre class="svg-xml language-svg"><code v-html="svgCode"></code></pre>
		</div>
	</section>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { highlight, languages } from "prismjs";
import ConfigText from "./demo-config.js?raw";
import GitHubIcon from "bootstrap-icons/icons/github.svg?sfc";

import AlarmIcon from "bootstrap-icons/icons/alarm-fill.svg?sfc";
import AlarmIcon2 from "bootstrap-icons/icons/alarm.svg?sfc";
import EnvelopeIcon from "bootstrap-icons/icons/envelope-paper-heart-fill.svg?sfc";
import EnvelopeIcon2 from "bootstrap-icons/icons/envelope-paper-heart.svg?sfc";
import SlidersIcon from "bootstrap-icons/icons/sliders.svg?sfc";
import SnowIcon from "bootstrap-icons/icons/snow2.svg?sfc";

import SpringIcon from "./assets/spring.svg?sfc";
import ImportAsset from "./assets/spring.svg";
import ImportUrl from "./assets/spring.svg?url";
import ImportRaw from "./assets/spring.svg?raw";

const color = ref("#0aa96d");
const size = ref(48);

const style = computed(() => ({
	color: color.value,
	fontSize: size.value + "px",
}));

const configCode = highlight(ConfigText, languages.javascript, "javascript");
const svgCode = highlight(ImportRaw, languages.markup, "svg");
</script>

<style>
body {
	margin: 0;
	font-family: sans-serif;
	tab-size: 4;
}

h1 {
	margin-top: 0;
}

pre {
	padding: 8px;
	font-size: 1rem;
	background: #f7f7f7;
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

.usage {
	display: flex;
	flex-direction: column;
	align-items: center;
	padding: 40px 10px;
}

.install {
	padding: 10px;
	border-radius: 4px;
	background: #f7f7f7;
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

.style-demo {
	font-size: 200px;
}

.svg-xml {
	height: 20em;
	overflow: scroll;
}

.import {
	padding: 6px;
	border-radius: 4px;
	color: white;
	background: #2e78ff;
}

.import-case {
	font-size: 48px;
	width: 48px;
	height: 48px;
}
</style>
