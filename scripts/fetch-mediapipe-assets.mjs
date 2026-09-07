#!/usr/bin/env node
// Fetches the MediaPipe WASM runtime + pretrained model files that this repo
// currently vendors directly under public/mediapipe/ (~45MB checked into
// git). This script lets you fetch them at build/setup time instead.
//
// IMPORTANT — read before wiring this into your build:
// The URLs below were verified against MediaPipe's own published npm
// package README and Google's official sample repos, but this exact script
// has NOT been run end-to-end in the environment that produced it (no
// network access there). Run it manually first —
//   node scripts/fetch-mediapipe-assets.mjs --out /tmp/mediapipe-check
// — and confirm the six .wasm/.js files and two .task files download and
// that the app still tracks correctly against them, BEFORE deleting the
// existing public/mediapipe/ files or wiring this into `predev`/`prebuild`.
// Only once you've verified it works should you remove public/mediapipe/
// from version control and add it to .gitignore.
//
// Usage:
//   node scripts/fetch-mediapipe-assets.mjs            # writes into public/mediapipe/
//   node scripts/fetch-mediapipe-assets.mjs --force     # re-download even if files exist
//   node scripts/fetch-mediapipe-assets.mjs --out DIR   # write elsewhere (for a dry run)

import { mkdir, readFile, writeFile, access } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, "..");

const args = process.argv.slice(2);
const force = args.includes("--force");
const outIndex = args.indexOf("--out");
const outDir = outIndex >= 0 && args[outIndex + 1] ? args[outIndex + 1] : join(repoRoot, "public", "mediapipe");

async function getTasksVisionVersion() {
  const packageJson = JSON.parse(await readFile(join(repoRoot, "package.json"), "utf8"));
  const range = packageJson.dependencies?.["@mediapipe/tasks-vision"];
  if (!range) throw new Error("Could not find @mediapipe/tasks-vision in package.json dependencies");
  // Strip a leading ^ or ~ to pin the exact version we fetch (jsDelivr needs
  // an exact version, not a semver range).
  return range.replace(/^[\^~]/, "");
}

async function fileExists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function downloadFile(url, destPath) {
  if (!force && (await fileExists(destPath))) {
    console.log(`skip (already exists): ${destPath}`);
    return;
  }
  console.log(`fetching ${url}`);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  await mkdir(dirname(destPath), { recursive: true });
  await writeFile(destPath, buffer);
  console.log(`wrote ${destPath} (${(buffer.byteLength / 1024).toFixed(0)} KB)`);
}

async function main() {
  const version = await getTasksVisionVersion();
  console.log(`Fetching MediaPipe assets for @mediapipe/tasks-vision@${version} into ${outDir}\n`);

  // WASM runtime — served from jsDelivr's mirror of the npm package itself,
  // so these are pinned to the exact version this repo depends on.
  const wasmBase = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${version}/wasm`;
  const wasmFiles = [
    "vision_wasm_internal.js",
    "vision_wasm_internal.wasm",
    "vision_wasm_module_internal.js",
    "vision_wasm_module_internal.wasm",
    "vision_wasm_nosimd_internal.js",
    "vision_wasm_nosimd_internal.wasm",
  ];
  for (const filename of wasmFiles) {
    await downloadFile(`${wasmBase}/${filename}`, join(outDir, "wasm", filename));
  }

  // Pretrained models — served from Google's own model bucket, versioned
  // independently of the npm package (revision "1" is the stable path
  // used throughout MediaPipe's official docs and samples).
  const models = [
    {
      url: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
      filename: "face_landmarker.task",
    },
    {
      url: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
      filename: "hand_landmarker.task",
    },
  ];
  for (const model of models) {
    await downloadFile(model.url, join(outDir, "models", model.filename));
  }

  console.log("\nDone. Verify the app still initializes tracking correctly against these files before removing the vendored copies from git.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
