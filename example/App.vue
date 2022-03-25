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
	<section class="showcase">
		<header>
			<h1>Responsive size and color</h1>
			<p>Replaced attributes with reactive value:</p>
			<ul>
				<li>set width & height to "1em".</li>
				<li>set fill and stroke to "currentColor" if it's not transparent.</li>
			</ul>
		</header>
		<div>
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
	<section class="showcase">
		<div>
			<SpringIcon class="style-demo"/>
		</div>
		<header>
			<h1>&lt;style&gt; support</h1>
			<p>
				vite-plugin-svg-sfc move &lt;style&gt; tags from SVG to SFC block,
				you can use all the features of CSS including pseudo class,
				media query, @keyframes etc...
			</p>
		</header>
	</section>
	<section class="showcase">
		<header>
			<h1>Work with vite:asset plugin</h1>
			<p>vite-plugin-svg-sfc does not affect Vite default asset handling.</p>

			<div class="import-grid">
				<span class="import">./assets/spring.svg?sfc</span>
				<SpringIcon class="import-case"/>

				<span class="import">./assets/spring.svg</span>
				<span>{{ ImportAsset }}</span>

				<span class="import">./assets/spring.svg?url</span>
				<span>{{ ImportUrl }}</span>
			</div>
		</header>
		<div>
			<span class="import">./assets/spring.svg?raw</span>
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
	line-height: 1.5;
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
	gap: 12px;
	margin: 0 auto;
	padding: 40px 10px;
}

label {
	display: inline-flex;
	align-items: center;
	gap: 5px;
	margin: 5px;
}

.usage {
	display: flex;
	flex-direction: column;
	align-items: center;
	padding: 40px 10px;
}

.import-grid {
	display: grid;
	grid-template-columns: auto 1fr;
	gap: 10px 20px;
	align-items: center;
}

.showcase > * {
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
	display: block;
	margin: 0 auto;
	font-size: 200px;
}

.svg-xml {
	height: 20em;
	overflow: scroll;
}

.import {
	grid-column: 1/2;
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
