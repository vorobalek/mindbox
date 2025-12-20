import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.resolve(__dirname, ".."); // src/frontend
const repoRoot = path.resolve(projectRoot, "../.."); // repo root
const outDir = path.resolve(repoRoot, "nginx/html/app");

const targets = [
  path.join(outDir, "bootstrap.js"),
  path.join(outDir, "bootstrap.js.map"),
  path.join(outDir, "sandbox.js"),
  path.join(outDir, "sandbox.js.map"),
  path.join(outDir, "sandbox.css"),
  path.join(outDir, "sandbox.css.map")
];

await Promise.all(
  targets.map(async (p) => {
    try {
      await fs.rm(p, { force: true });
      // eslint-disable-next-line no-console
      console.log(`[clean] removed ${path.relative(repoRoot, p)}`);
    } catch {
      // ignore
    }
  })
);


