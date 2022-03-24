import { readFileSync, writeFileSync } from "fs";
import ts from "typescript";
import tsConfig from "../tsconfig.json" assert { type: "json" };

tsConfig.compilerOptions.module = "CommonJS";
tsConfig.compilerOptions.declaration = false;
tsConfig.compilerOptions.sourceMap = false;

const source = readFileSync("index.ts", "utf8");
const output = ts.transpileModule(source, tsConfig);

writeFileSync("index.cjs", output.outputText);
