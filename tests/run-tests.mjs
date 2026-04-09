import { readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const testsDir = new URL("./", import.meta.url);
const testsDirPath = fileURLToPath(testsDir);
const entries = await readdir(testsDir, { withFileTypes: true });

for (const entry of entries) {
  if (!entry.isFile() || !entry.name.endsWith(".test.mjs") || entry.name === "playwright.test.mjs") {
    continue;
  }

  const filePath = path.join(testsDirPath, entry.name);
  await import(pathToFileURL(filePath).href);
}
