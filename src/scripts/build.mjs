import * as esbuild from "esbuild";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.resolve(__dirname, ".."); // src
const repoRoot = path.resolve(projectRoot, ".."); // repo root
const outDir = path.resolve(repoRoot, "dist");

const watch = process.argv.includes("--watch");
const dev = process.argv.includes("--dev") || watch;

const buildOptions = {
  absWorkingDir: projectRoot,
  entryPoints: {
    bootstrap: "entries/bootstrap.ts",
    sandbox: "entries/sandbox.tsx"
  },
  outdir: outDir,
  entryNames: "[name]",
  assetNames: "[name]",
  bundle: true,
  platform: "browser",
  format: "iife",
  target: ["es2019"],
  minify: !dev,
  sourcemap: dev ? "linked" : false,
  jsx: "automatic",
  charset: "utf8",
  legalComments: "none",
  define: {
    "process.env.NODE_ENV": JSON.stringify(dev ? "development" : "production")
  },
  banner: {
    js: "/* GENERATED FILE. Source: src/frontend. Do not edit in nginx/html. */",
    css: "/* GENERATED FILE. Source: src/frontend. Do not edit in nginx/html. */"
  }
};

const ctx = await esbuild.context(buildOptions);

if (watch) {
  await ctx.watch();
  // eslint-disable-next-line no-console
  console.log(`[frontend] watching… output → ${outDir}`);
} else {
  await ctx.rebuild();
  await ctx.dispose();
  // eslint-disable-next-line no-console
  console.log(`[frontend] built → ${outDir}`);
}


