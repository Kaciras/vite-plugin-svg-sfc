# vite-plugin-svg-sfc

[![Npm Version](https://img.shields.io/npm/v/vite-plugin-svg-sfc)](https://www.npmjs.com/package/vite-plugin-svg-sfc)
[![Test](https://github.com/Kaciras/vite-plugin-svg-sfc/actions/workflows/test.yml/badge.svg)](https://github.com/Kaciras/vite-plugin-svg-sfc/actions/workflows/test.yml)
[![codecov](https://codecov.io/gh/Kaciras/vite-plugin-svg-sfc/branch/master/graph/badge.svg?token=LJ6ZXPWJWP)](https://codecov.io/gh/Kaciras/vite-plugin-svg-sfc)

Vite (also support Rollup) plugin to convert SVGs to Vue single file components (SFC).

[Demo](https://kaciras.github.io/vite-plugin-svg-sfc/)

🚀 Features

* Extract `<style>` tags from SVG to scoped SFC style block.
* Support Hot Module Replacement.
* Support custom import mark.
* [SVGO](https://github.com/svg/svgo) minification with sensible defaults.

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
import myIconRaw from "../assets/my-icon.svg?raw";
</script>
```

If you are using TypeScript, `vite-plugin-svg-sfc/client` can be added to `d.ts` declaration file.

```typescript
/// <reference types="vite-plugin-svg-sfc/client" />
```

You can add more than one of this plugin with different marks.

```javascript
export default defineConfig({
    plugins: [
        vue(),
        // matches *.svg?icon
        svgSfc({ mark: "icon", svgProps: { class: "icon" } }),
        // matches *.svg?img
        svgSfc({ mark: "img", responsive: false }),
    ],
});
```

Build a component library:

```javascript
// index.js
export { default as FooIcon } from "./icons/foo.svg?sfc";
export { default as BarIcon } from "./icons/bar.svg?sfc";
```

```typescript
import { defineConfig } from "vite";
import svgSfc from "vite-plugin-svg-sfc";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
    plugins: [svgSfc(), vue()],
    build: {
        rollupOptions: {
            external: "vue",
        },
        lib: {
            formats: ["es"],
            entry: "index.js",
        },
    },
});
```

### Without Vite

`SVGSFCConvertor` is exported for convert SVG to SFC code without build tools.

```typescript
import { SVGSFCConvertor } from "vite-plugin-svg-sfc";

const svg2sfc = new SVGSFCConvertor();
const vueCode = svg2sfc.convert("<svg>...</svg>");
// <template><svg>...</svg></template>...
```

## Options

### mark

Type: `string`

Default: `sfc`

SVG will be imported as SFC using the query parameter.

```javascript
// vite.config.js
export default defineConfig({
    plugins: [svgSfc({ mark: "component" }), vue()],
});

// Vue component.
import Icon from "../assets/my-icon.svg?component";
```

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

If `svgo.plugins` is specified, the `extractStyles`, `minify`, `svgProps`, `responsive` options and builtin plugins are ignored, you can add them manually:

```typescript
import svgSfc from "vite-plugin-svg-sfc";

svgSfc({
    svgo: {
        plugins: [
            "responsiveSVGAttrs",
            "extractCSS",
            "preset-default",
            {
                name: "modifySVGAttrs",
                params(attrs) {
                    delete attrs.xmlns;
                    delete attrs.version;
                    delete attrs["xml:space"];
                }
            }
        ]
    }
});
```
