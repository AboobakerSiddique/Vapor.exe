# Notice and attribution

This project is a substantially extended fork of **[Virtual Smoke](https://github.com/KwonTaeJunDS/Virtual_Smoke)** by TaeJun Kwon, licensed under the MIT License. The original license and copyright notice are preserved unmodified in [LICENSE](LICENSE), as required by the MIT License.

## Third-party assets and runtimes bundled in this repo

### MediaPipe (Google)

`public/mediapipe/` contains:

- The MediaPipe Tasks Vision WASM runtime (`wasm/`), part of the [`@mediapipe/tasks-vision`](https://www.npmjs.com/package/@mediapipe/tasks-vision) npm package.
- Pretrained `face_landmarker.task` and `hand_landmarker.task` model files, published by Google at `storage.googleapis.com/mediapipe-models/`.

Both are © Google and distributed under the [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0). No modifications have been made to these files. See `scripts/fetch-mediapipe-assets.mjs` for the option to fetch them at build time instead of vendoring them in the repo.

### Other dependencies

All other runtime dependencies (React, Three.js, Zustand, Drizzle ORM, etc.) are used under their own respective licenses (MIT/Apache-2.0, typical for these packages) via npm and are not modified or redistributed as part of this repo beyond normal `package.json` dependency declarations.

## What's changed from the original

The camera pipeline, MediaPipe integration, interaction state machine, and core GLSL particle system originate from the upstream project. Substantial additions on top of that foundation include: falling ash particles, an ambient wind system, multiple selectable smoke presets, hand-region occlusion and volumetric-style shading, a floating settings UI, adjustable tracking sensitivity, adaptive MediaPipe inference throttling, and mobile safe-area handling.
