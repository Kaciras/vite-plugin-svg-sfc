# vite-plugin-svg-sfc

[![Test](https://github.com/Kaciras/vite-plugin-svg-sfc/actions/workflows/test.yml/badge.svg)](https://github.com/Kaciras/vite-plugin-svg-sfc/actions/workflows/test.yml)
[![codecov](https://codecov.io/gh/Kaciras/vite-plugin-svg-sfc/branch/master/graph/badge.svg?token=LJ6ZXPWJWP)](https://codecov.io/gh/Kaciras/vite-plugin-svg-sfc)

Vite plugin to convert SVGs to Vue single file components(SFC).

🚀 Features

* Extract `<style>` tags from SVG to SFC scoped style block.
* Hot Module Replacement support.
* Minification with [SVGO](https://github.com/svg/svgo).

## Usage

Install:

```
npm i -D vite-plugin-svg-sfc
```

Then add the plugin to your `vite.config.js`:

```typescript
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import svgSfc from "vite-plugin-svg-sfc";

export default defineConfig({
	plugins: [svgSfc(), vue()],
});
```

SVG files can be imported as Vue component using the `?sfc` query:

```vue
<template>
    <MyIconComponent/>
    <img :src="myIconUrl" alt="icon">
    <pre>{{ myIconXml }}</pre>
</template>

<script setup>
import MyIconComponent from "../assets/my-icon.svg?sfc";

// vite-plugin-svg-sfc does not affect Vite default asset handling.
import myIconUrl from "../assets/my-icon.svg";
import myIconXml from "../assets/my-icon.svg?raw";
</script>
```

## Typescript

If you are using TypeScript, `vite-plugin-svg-sfc/client` can be added to `d.ts` declaration file.

```typescript
/// <reference types="vite-plugin-svg-sfc/client" />
```
