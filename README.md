# vite-plugin-svg-sfc

[![Npm Version](https://img.shields.io/npm/v/vite-plugin-svg-sfc)](https://www.npmjs.com/package/vite-plugin-svg-sfc)
[![Test](https://github.com/Kaciras/vite-plugin-svg-sfc/actions/workflows/test.yml/badge.svg)](https://github.com/Kaciras/vite-plugin-svg-sfc/actions/workflows/test.yml)
[![codecov](https://codecov.io/gh/Kaciras/vite-plugin-svg-sfc/branch/master/graph/badge.svg?token=LJ6ZXPWJWP)](https://codecov.io/gh/Kaciras/vite-plugin-svg-sfc)

Vite (also support Rollup) plugin to convert SVGs to Vue single file components(SFC).

[example](https://kaciras.github.io/vite-plugin-svg-sfc/)

🚀 Features

* Extract `<style>` tags from SVG to scoped SFC style block.
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

// If in commonjs module
// const { default: svgSfc } = require("vite-plugin-svg-sfc");

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

If you are using TypeScript, `vite-plugin-svg-sfc/client` can be added to `d.ts` declaration file.

```typescript
/// <reference types="vite-plugin-svg-sfc/client" />
```

### Without Vite

`SVGSFCConvertor` is exported for convert SVG to SFC code without build tools.

```typescript
import { SVGSFCConvertor } from "vite-plugin-svg-sfc";

const svg2sfc = new SVGSFCConvertor();
const vueCode = svg2sfc.convert("<svg>...</svg>");
```

## Options

### `extractCSS`

Type: `boolean`

Default: `true`

When set to true, extract all style elements in the svg and put their content into a scoped SFC style block.

Vue template compiler will throw an error when the template contains `<style>`, so we need to move them to top level.

You may notice that SVGO has a `inlineStyles` plugin that avoid `<style>` in the SVG by move styles onto the `style` attribute, but some features (e.g. media query) can not be inlined.

### `minify`

Type: `boolean`

Default: `true` on production mode and `false` otherwise.

Perform minification for SVG.

### `responsive`

Type: `boolean`

Default: `true`

When set to true, some attributes on `<svg>` will be replaced with reactive value:

* set width & height to "1em".
* set fill and stroke to "currentColor" if it's not transparent。

### `svgProps`

Type: `Record<string, string>`

Default: `undefined`

Add props to the root SVG tag.

### `svgo`

Type: `OptimizeOptions | false`

Default: `{}`

Specify the SVGO config to use, set to false to disable processing SVG data.

If `svgo.plugins` is specified, the `extractStyles`, `minify`, `svgProps` and `responsive` options are ignored, you can add them manually:

```typescript
import svgSfc from "vite-plugin-svg-sfc";

svgSfc({
    svgo: {
        plugins: [
            "responsiveSVGAttrs",
            "extractCSS",
            "preset-default",
            {
                name: "setSVGAttrs",
                params: { foo: "bar" }
            }
        ]
    }
});
```
