import assert from "node:assert/strict";
import { build } from "esbuild";
import { access, readFile, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

async function loadInteractionEngine() {
  const projectDirectory = fileURLToPath(new URL("..", import.meta.url));
  const result = await build({
    absWorkingDir: projectDirectory,
    entryPoints: ["app/lib/interaction-engine.ts"],
    bundle: true,
    format: "esm",
    platform: "node",
    write: false,
    minify: true,
  });
  const source = result.outputFiles[0].text;
  return import(`data:text/javascript;base64,${Buffer.from(source).toString("base64")}`);
}

function sampleFace(overrides = {}) {
  return {
    visible: true,
    inGracePeriod: false,
    landmarks: [],
    center: { x: 0.5, y: 0.42, z: 0 },
    forehead: { x: 0.5, y: 0.25, z: 0 },
    chin: { x: 0.5, y: 0.58, z: 0 },
    mouthCenter: { x: 0.5, y: 0.5, z: 0 },
    mouthLeft: { x: 0.46, y: 0.5, z: 0 },
    mouthRight: { x: 0.54, y: 0.5, z: 0 },
    noseLeft: { x: 0.488, y: 0.45, z: 0 },
    noseRight: { x: 0.512, y: 0.45, z: 0 },
    faceWidth: 0.24,
    faceHeight: 0.22,
    mouthWidth: 0.08,
    mouthWidthRatio: 0.333,
    mouthOpenRatio: 0.03,
    mouthPursed: false,
    mouthState: "CLOSED",
    yaw: 0,
    roll: 0,
    ...overrides,
  };
}

function sampleHand(state, point) {
  const landmarks = Array.from({ length: 21 }, () => ({ ...point }));
  landmarks[8] = { ...point };
  landmarks[12] = { x: point.x, y: point.y + 0.02, z: 0 };
  return {
    id: "test-hand",
    visible: true,
    landmarks,
    state,
    pinchDistance: state === "PINCH" ? 0.1 : 1,
    palmSize: 0.1,
    gripPoint: { ...point },
    indexTip: { ...point },
    middleTip: { x: point.x, y: point.y + 0.02, z: 0 },
  };
}

function attachCigarette(engine, face, startTime = 100) {
  let now = startTime;
  const restPoint = { x: 0.5, y: 0.7, z: 0 };
  engine.update(face, [sampleHand("PINCH", restPoint)], now, 0.05, "GPU");
  for (let frame = 0; frame < 16; frame += 1) {
    now += 50;
    engine.update(face, [sampleHand("PINCH", face.mouthCenter)], now, 0.05, "GPU");
  }
  now += 50;
  engine.update(face, [sampleHand("NONE", face.mouthCenter)], now, 0.05, "GPU");
  now += 120;
  engine.update(face, [sampleHand("NONE", face.mouthCenter)], now, 0.05, "GPU");
  assert.match(engine.getSnapshot().cigaretteState, /^MOUTH_/);
  return now;
}

test("renders the local AR experience shell and production metadata", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  const html = await response.text();
  assert.match(html, /<title>VAPOR\.exe<\/title>/i);
  assert.match(html, /class="experience"/i);
  assert.match(html, /class="camera"/i);
  assert.match(html, /class="render-canvas"/i);
  assert.match(html, /og\.png/i);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape|react-loading-skeleton/i);
});

test("keeps every runtime model and Wasm dependency inside the project", async () => {
  const requiredAssets = [
    "../public/mediapipe/models/face_landmarker.task",
    "../public/mediapipe/models/hand_landmarker.task",
    "../public/mediapipe/wasm/vision_wasm_internal.wasm",
    "../public/mediapipe/wasm/vision_wasm_module_internal.wasm",
    "../public/mediapipe/wasm/vision_wasm_nosimd_internal.wasm",
    "../public/og.png",
  ];
  for (const relativePath of requiredAssets) {
    const url = new URL(relativePath, import.meta.url);
    await access(url);
    assert.ok((await stat(url)).size > 0, `${relativePath} must not be empty`);
  }

  const tracker = await readFile(new URL("../app/lib/vision-tracker.ts", import.meta.url), "utf8");
  const experience = await readFile(new URL("../app/smoking-experience.tsx", import.meta.url), "utf8");
  assert.match(tracker, /delegate:\s*"GPU"/);
  assert.match(tracker, /processLatest\(video: HTMLVideoElement, sourceTimestamp: number\)/);
  assert.match(tracker, /if \(this\.inferenceInFlight\) return null/);
  assert.match(tracker, /this\.scheduleIndex === 2 \? "FACE" : "HAND"/);
  assert.match(tracker, /numHands:\s*1/);
  assert.match(tracker, /this\.hands\.detectForVideo\(video, inferenceTimestamp\)/);
  assert.match(tracker, /this\.face\.detectForVideo\(video, inferenceTimestamp\)/);
  assert.doesNotMatch(tracker, /inferenceIntervalMs|inputCanvas|drawImage\(video/);
  assert.match(tracker, /outputFaceBlendshapes:\s*false/);
  assert.match(tracker, /faceContext:\s*this\.contextKind/);
  assert.match(tracker, /handContext:\s*this\.contextKind/);
  assert.match(tracker, /\/mediapipe\/models\/face_landmarker\.task/);
  assert.match(tracker, /\/mediapipe\/models\/hand_landmarker\.task/);
  assert.doesNotMatch(tracker, /https?:\/\//);
  assert.match(experience, /requestVideoFrameCallback/);
  assert.match(experience, /scheduleTracking\(\)/);
  assert.match(experience, /trackingSchedule = "LATEST_FRAME"/);
  assert.match(experience, /dataset\.worstFrameMs/);
  assert.match(experience, /dataset\.inputLatencyMs/);
});

test("uses the burn, one-shot mouth and nose smoke, and falling flow", async () => {
  const [engine, analyzer, renderer, experience, types, store, config, presets, packageJson] = await Promise.all([
    readFile(new URL("../app/lib/interaction-engine.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/lib/analyzers.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/lib/smoke-renderer.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/smoking-experience.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/lib/types.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/lib/store.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/lib/config.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/lib/smoke-presets.ts", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);
  // Tunable constants live in config.ts (see app/lib/config.ts) — interaction-engine.ts
  // and smoke-renderer.ts now import them instead of declaring them locally.
  assert.match(config, /CIGARETTE_FACE_SCALE = 0\.275/);
  assert.match(config, /CIGARETTE_MIN_LENGTH = 0\.0475/);
  assert.match(config, /FULL_BURN_SECONDS = 7 \* 1\.4/);
  assert.match(config, /NOSE_EXHALE_DELAY_MS = 3000/);
  assert.match(config, /EFFECT_LABEL_MS = 900/);
  assert.match(config, /MAX_PARTICLES = 8000/);
  assert.match(config, /SMOKE_VOLUME_MULTIPLIER = 5/);
  assert.match(engine, /heldNearMouth/);
  assert.match(engine, /face\.mouthWidth \* 1\.25/);
  assert.doesNotMatch(engine, /MOUTH_EXHALE_DURATION_MS|NOSE_EXHALE_DURATION_MS|SMOKE_PULSE_INTERVAL_MS|updateActiveExhale/);
  assert.match(engine, /face\.mouthPursed/);
  assert.match(engine, /cigaretteBurn \+ dt \/ FULL_BURN_SECONDS/);
  assert.match(engine, /type: "MOUTH_BURST"/);
  assert.match(engine, /type: "NOSE_BURST"/);
  assert.doesNotMatch(`${engine}\n${renderer}\n${types}\n${store}`, /STAR_BURST|starBurst|cheekLeft|cheekRight/);
  assert.match(engine, /cigaretteState = "FALLING"/);
  assert.match(engine, /fallVelocity\.y \+= 0\.72 \* dt/);
  assert.match(analyzer, /mouthWidthRatio <= 0\.31/);
  assert.match(analyzer, /aspect >= threshold/);
  assert.doesNotMatch(`${engine}\n${types}\n${store}`, /MOUTH_ARM_THRESHOLD|MOUTH_RELEASE_DROP|LIP_CONTRACTION|mouthOpenPeak|mouthGesturePhase|smokePulseCount|\bEXHALE_DURATION_MS\b/);
  assert.match(renderer, /powerPreference:\s*"high-performance"/);
  assert.match(renderer, /material\.side\s*=\s*THREE\.DoubleSide/);
  assert.match(renderer, /mappedBaseLength \* \(this\.width \/ this\.height\) \* 1\.15/);
  assert.match(renderer, /hardwareAccelerated/);
  assert.match(renderer, /ShaderMaterial/);
  assert.match(renderer, /Points/);
  assert.match(renderer, /float fbm\(vec2 point\)/);
  assert.match(renderer, /premultipliedAlpha:\s*false/);
  // Smoke color/opacity are now preset-driven uniforms (see app/lib/smoke-presets.ts)
  // instead of hardcoded shader literals — REALISTIC_PRESET encodes the same #696969
  // value the shader used to hardcode directly.
  assert.match(renderer, /uniform vec3 uColor/);
  assert.match(renderer, /vec3 color = uColor/);
  assert.doesNotMatch(renderer, /vec3 color = vec3\(0\.4117647\)/);
  assert.match(presets, /color:\s*\[0\.4117647,\s*0\.4117647,\s*0\.4117647\]/);
  assert.match(presets, /tipOpacity:\s*0\.068/);
  assert.match(presets, /burstOpacity:\s*0\.055/);
  assert.match(presets, /noseOpacityBonus:\s*0\.007/);
  // P1: additional presets and ash/wind/turbulence plumbing.
  assert.match(config, /ASH_SPAWN_RATE = 4/);
  assert.match(presets, /export const CINEMATIC_PRESET/);
  assert.match(presets, /export const GHOSTLY_PRESET/);
  assert.match(presets, /export const NEON_PRESET/);
  assert.match(presets, /export const DENSE_PRESET/);
  assert.match(presets, /blending:\s*"additive"/);
  assert.match(presets, /turbulenceScale:\s*1/);
  assert.match(renderer, /uniform float uTurbulenceScale/);
  assert.match(renderer, /uniform vec2 uWindDirection/);
  assert.match(renderer, /uniform float uWindStrength/);
  assert.match(renderer, /uniform vec3 uAshColor/);
  assert.match(renderer, /uniform float uAshOpacity/);
  assert.match(renderer, /float isAsh = step\(2\.5, aKind\)/);
  assert.match(renderer, /setWind\(directionX: number, directionY: number, strength: number\)/);
  assert.match(renderer, /ASH_SPAWN_RATE/);
  assert.match(renderer, /setAttribute\("position", new THREE\.BufferAttribute\(new Float32Array\(MAX_PARTICLES \* 3\), 3\)\)/);
  assert.match(renderer, /setDrawRange\(0, MAX_PARTICLES\)/);
  assert.match(renderer, /depthTest:\s*false/);
  assert.match(renderer, /mouthParticleCount/);
  assert.match(renderer, /burning \? this\.baseSmokeAccumulator \+ dt \* 60 \* this\.qualityFactor\(\) : 0/);
  assert.match(renderer, /emitMouthBurst/);
  assert.match(renderer, /emitNoseBurst/);
  assert.match(renderer, /markParticlesDirty/);
  assert.match(renderer, /Math\.round\(\(280 \+ emission\.strength \* 120\) \* SMOKE_VOLUME_MULTIPLIER \* factor\)/);
  assert.match(renderer, /Math\.round\(\(70 \+ emission\.strength \* 24\) \* SMOKE_VOLUME_MULTIPLIER \* factor\)/);
  assert.match(renderer, /particleDrawCount/);
  assert.doesNotMatch(experience, /smokePreview/);
  assert.match(experience, /const snapshot = engine\.update\(face, hands, now, dt, delegate\)/);
  assert.match(packageJson, /"dev":\s*"vinext dev"/);
});

test("emits one mouth or nose batch and burns down", async () => {
  const { InteractionEngine } = await loadInteractionEngine();
  const face = sampleFace();
  const pursed = sampleFace({ mouthWidth: 0.068, mouthWidthRatio: 0.283, mouthPursed: true });

  const heldEngine = new InteractionEngine(() => {});
  let heldNow = 100;
  heldEngine.update(face, [sampleHand("PINCH", { x: 0.5, y: 0.7, z: 0 })], heldNow, 0.05, "GPU");
  for (let frame = 0; frame < 8; frame += 1) {
    heldNow += 50;
    heldEngine.update(pursed, [sampleHand("PINCH", pursed.mouthCenter)], heldNow, 0.05, "GPU");
  }
  assert.equal(heldEngine.getSnapshot().cigaretteState, "HAND_HELD");
  assert.equal(heldEngine.getSnapshot().smokingState, "INHALING");
  assert.ok(heldEngine.getSnapshot().cigaretteBurn > 0);

  const emissions = [];
  const engine = new InteractionEngine((emission) => emissions.push(emission));
  let now = attachCigarette(engine, face);

  for (let frame = 0; frame < 28; frame += 1) {
    now += 50;
    engine.update(pursed, [], now, 0.05, "GPU");
  }
  assert.equal(engine.getSnapshot().smokingState, "INHALING");
  assert.ok(engine.getSnapshot().cigaretteBurn > 0.13 && engine.getSnapshot().cigaretteBurn < 0.16);

  const open = sampleFace({ mouthOpenRatio: 0.13, mouthState: "OPEN" });
  now += 50;
  engine.update(open, [], now, 0.05, "GPU");
  assert.equal(emissions.filter((emission) => emission.type === "MOUTH_BURST").length, 1);
  for (let frame = 0; frame < 29; frame += 1) {
    now += 60;
    engine.update(open, [], now, 0.05, "GPU");
  }
  assert.equal(
    emissions.filter((emission) => emission.type === "MOUTH_BURST").length,
    1,
    "holding the mouth open must not repeat the one-shot smoke batch",
  );

  for (let frame = 0; frame < 10; frame += 1) {
    now += 50;
    engine.update(pursed, [], now, 0.05, "GPU");
  }
  now += 50;
  engine.update(face, [], now, 0.05, "GPU");
  now += 3050;
  engine.update(face, [], now, 0.05, "GPU");
  assert.equal(emissions.filter((emission) => emission.type === "NOSE_BURST").length, 1);
  for (let frame = 0; frame < 36; frame += 1) {
    now += 60;
    engine.update(face, [], now, 0.05, "GPU");
  }
  assert.equal(
    emissions.filter((emission) => emission.type === "NOSE_BURST").length,
    1,
    "nose smoke must also be emitted as one batch",
  );

  while (engine.getSnapshot().cigaretteState !== "FALLING") {
    now += 50;
    engine.update(pursed, [], now, 0.05, "GPU");
    assert.ok(now < 30000, "cigarette must burn out in bounded time");
  }
  assert.equal(engine.getSnapshot().cigaretteBurn, 1);
  assert.ok(engine.getSnapshot().cigaretteLength <= engine.getSnapshot().cigaretteBaseLength * 0.29);
});

test("P2: settings store, control panel, and sensitivity/intensity plumbing exist and are wired up", async () => {
  const [settingsStore, controlPanel, experience, renderer, engine, css] = await Promise.all([
    readFile(new URL("../app/lib/settings-store.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/controls/control-panel.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/smoking-experience.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/lib/smoke-renderer.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/lib/interaction-engine.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);

  // Settings store holds user-facing settings, distinct from the debug-only
  // useInteractionStore in store.ts.
  assert.match(settingsStore, /export const useSettingsStore = create<SettingsState>/);
  assert.match(settingsStore, /preset: REALISTIC_PRESET/);
  assert.match(settingsStore, /reset: \(\) =>/);

  // Renderer: intensity is a standalone uniform independent of preset values.
  assert.match(renderer, /uniform float uIntensity/);
  assert.match(renderer, /mix\(smokeAlpha, ashAlpha, isAsh\) \* uIntensity/);
  assert.match(renderer, /setIntensity\(value: number\)/);

  // Engine: sensitivity scales proximity thresholds and is clamped.
  assert.match(engine, /private sensitivity = 1/);
  assert.match(engine, /setSensitivity\(value: number\)/);
  assert.match(engine, /clamp\(value, 0\.5, 1\.75\)/);
  assert.match(engine, /this\.sensitivity/);

  // Control panel: collapsed-by-default FAB (progressive disclosure), style
  // picker sourced from SMOKE_PRESETS, and the required action buttons.
  assert.match(controlPanel, /className="control-fab"/);
  assert.match(controlPanel, /SMOKE_PRESETS\.map/);
  assert.match(controlPanel, /toggleFullscreen/);
  assert.match(controlPanel, /toggleMirrored/);
  assert.match(controlPanel, /onClick=\{reset\}/);
  assert.match(controlPanel, /toggleHelp/);
  assert.doesNotMatch(controlPanel, /localStorage|sessionStorage/);

  // Experience: mounts the panel, applies settings to the renderer/engine,
  // unsubscribes on cleanup, and has a distinct tracking-initializing state
  // plus a retry path on permission-denied.
  assert.match(experience, /<ControlPanel \/>/);
  assert.match(experience, /visual\?\.setPreset\(settings\.preset\)/);
  assert.match(experience, /visual\?\.setIntensity\(settings\.intensity\)/);
  assert.match(experience, /visual\?\.setWind\(1, 0, settings\.windStrength\)/);
  assert.match(experience, /engine\?\.setSensitivity\(settings\.sensitivity\)/);
  assert.match(experience, /unsubscribeSettings = useSettingsStore\.subscribe\(applySettings\)/);
  assert.match(experience, /unsubscribeSettings\?\.\(\)/);
  assert.match(experience, /"initializing-tracking"/);
  assert.match(experience, /setRetryToken/);
  assert.match(experience, /data-mirrored=\{mirrored\}/);

  // CSS: mirror is implemented by swapping which layer carries the flip
  // (video vs canvases), never a shared-parent transform, so tracking
  // coordinate math in analyzers.ts is never touched by this feature.
  assert.match(css, /\.experience\[data-mirrored="true"\] \.camera \{ transform: scaleX\(-1\); \}/);
  assert.match(css, /\.experience\[data-mirrored="false"\] \.render-canvas,/);
  assert.doesNotMatch(css, /\.experience\[data-mirrored="[a-z]+"\]\s*\{\s*transform:/);
});

test("P3: hand-region occlusion and volumetric self-shading exist and don't disturb existing alpha math", async () => {
  const renderer = await readFile(new URL("../app/lib/smoke-renderer.ts", import.meta.url), "utf8");

  // New uniforms/varyings for occlusion and shading.
  assert.match(renderer, /uniform vec2 uOccluderCenter/);
  assert.match(renderer, /uniform float uOccluderRadius/);
  assert.match(renderer, /uniform float uOccluderStrength/);
  assert.match(renderer, /varying vec2 vScreenPos/);
  assert.match(renderer, /varying float vLifeT/);
  assert.match(renderer, /vScreenPos = position\.xy/);
  assert.match(renderer, /vLifeT = lifeT/);

  // Occlusion is gated by particle age (ageEligible) so freshly-spawned tip
  // smoke at the ember (right next to the held cigarette) isn't erased.
  assert.match(renderer, /float ageEligible = smoothstep\(0\.25, 0\.45, vLifeT\)/);
  assert.match(renderer, /smokeAlpha \*= \(1\.0 - occlusion \* 0\.85\)/);

  // Occlusion strength is only nonzero while a hand is actually holding the
  // cigarette (not IDLE/FALLING), and reuses the already-mapped cigarette
  // position rather than requiring new landmark data to be threaded in.
  assert.match(
    renderer,
    /const held = snapshot\.cigaretteState !== "IDLE" && snapshot\.cigaretteState !== "FALLING"/,
  );
  assert.match(renderer, /uOccluderStrength\.value = held \? 1 : 0/);
  assert.match(renderer, /uOccluderRadius\.value = Math\.max\(0\.03, mappedBaseLength \* 1\.8\)/);

  // Volumetric self-shading reuses the existing fbm noise (no new noise
  // computation) and only affects smoke color, not ash's flat disc look.
  assert.match(renderer, /float density = clamp\(broadNoise \* 0\.6 \+ fineNoise \* 0\.4, 0\.0, 1\.0\)/);
  assert.match(renderer, /vec3 smokeColor = uColor \* mix\(1\.15, 0\.82, density\)/);
  assert.match(renderer, /vec3 color = mix\(smokeColor, uAshColor, isAsh\)/);
});

test("P4: adaptive tracking throttle and mobile safe-area handling exist and are wired up", async () => {
  const [tracker, renderer, experience, layout, css] = await Promise.all([
    readFile(new URL("../app/lib/vision-tracker.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/lib/smoke-renderer.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/smoking-experience.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);

  // Tracker: frame-skip throttle, independent of confidence thresholds or
  // model files (see the audit's note that this avoids an unverifiable new
  // model-asset dependency).
  assert.match(tracker, /setPerformanceMode\(mode: "HIGH" \| "MEDIUM" \| "LOW"\)/);
  assert.match(tracker, /this\.frameSkipInterval = mode === "HIGH" \? 1 : mode === "MEDIUM" \? 2 : 3/);
  assert.match(tracker, /this\.frameSkipCounter \+= 1/);
  assert.match(tracker, /if \(this\.frameSkipCounter < this\.frameSkipInterval\) return null/);
  // The dedup check for a duplicate (non-new) video frame must come before
  // the throttle counter increments, so duplicates never consume a slot.
  const dedupIndex = tracker.indexOf("video.currentTime === this.lastVideoTime");
  const throttleIndex = tracker.indexOf("this.frameSkipCounter += 1");
  assert.ok(dedupIndex > -1 && throttleIndex > -1 && dedupIndex < throttleIndex);

  // Renderer exposes its adaptive quality tier so the tracker can reuse the
  // same signal instead of computing a second one.
  assert.match(renderer, /export type Quality = "HIGH" \| "MEDIUM" \| "LOW"/);
  assert.match(renderer, /getQuality\(\): Quality/);

  // Experience wires renderer quality -> tracker throttle every frame.
  assert.match(experience, /tracker\?\.setPerformanceMode\(visual\.getQuality\(\)\)/);

  // Layout: viewport-fit cover so the safe-area env() vars in globals.css
  // are populated on notched devices.
  assert.match(layout, /viewportFit: "cover"/);
  assert.match(css, /env\(safe-area-inset-bottom\)/);
  assert.match(css, /env\(safe-area-inset-right\)/);
  assert.match(css, /env\(safe-area-inset-top\)/);
});

test("P5: attribution, CI, and the opt-in MediaPipe fetch script exist and are self-consistent", async () => {
  const [license, notice, readme, ci, fetchScript, packageJson] = await Promise.all([
    readFile(new URL("../LICENSE", import.meta.url), "utf8"),
    readFile(new URL("../NOTICE.md", import.meta.url), "utf8"),
    readFile(new URL("../README.md", import.meta.url), "utf8"),
    readFile(new URL("../.github/workflows/ci.yml", import.meta.url), "utf8"),
    readFile(new URL("../scripts/fetch-mediapipe-assets.mjs", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);

  // The original MIT license/copyright notice must be preserved verbatim.
  assert.match(license, /MIT License/);
  assert.match(license, /Copyright \(c\) 2026 TaeJun Kwon/);

  // Attribution: original project + MediaPipe/Google, per the audit's
  // license & attribution requirements.
  assert.match(notice, /Virtual Smoke.*TaeJun Kwon/s);
  assert.match(notice, /Apache License 2\.0/);
  assert.match(notice, /storage\.googleapis\.com\/mediapipe-models/);
  assert.match(readme, /NOTICE\.md/);

  // CI runs the project's own existing lint + test commands, not new
  // reinvented steps.
  assert.match(ci, /actions\/checkout@v4/);
  assert.match(ci, /actions\/setup-node@v4/);
  assert.match(ci, /npm ci/);
  assert.match(ci, /npm run lint/);
  assert.match(ci, /npm test/);

  // Fetch script: opt-in only (not wired into predev/prebuild), pulls the
  // exact filenames already vendored under public/mediapipe/, and reads the
  // MediaPipe version from package.json rather than hardcoding it.
  const pkg = JSON.parse(packageJson);
  assert.equal(pkg.scripts.dev, "vinext dev", "fetch script must not be silently wired into dev");
  assert.equal(pkg.scripts.build, "vinext build", "fetch script must not be silently wired into build");
  assert.equal(pkg.scripts["fetch:mediapipe"], "node scripts/fetch-mediapipe-assets.mjs");
  assert.match(fetchScript, /dependencies\?\.\["@mediapipe\/tasks-vision"\]/);
  assert.match(fetchScript, /vision_wasm_internal\.js/);
  assert.match(fetchScript, /vision_wasm_module_internal\.wasm/);
  assert.match(fetchScript, /vision_wasm_nosimd_internal\.wasm/);
  assert.match(fetchScript, /face_landmarker\.task/);
  assert.match(fetchScript, /hand_landmarker\.task/);
  assert.match(fetchScript, /has NOT been run end-to-end/);
});

test("P6: VAPOR.exe redesign — boot gate, HUD, and branding exist without touching tracking/rendering logic", async () => {
  const [experience, bootScreen, controlPanel, css, page, layout, packageJson] = await Promise.all([
    readFile(new URL("../app/smoking-experience.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/boot/boot-screen.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/controls/control-panel.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);

  // Boot gate: the experience shell (video/canvases) must stay
  // unconditionally mounted — BootScreen renders as an overlay ON TOP of it,
  // not as a replacement, so refs and the SSR'd shell never disappear.
  assert.match(experience, /const \[entered, setEntered\] = useState\(false\)/);
  assert.match(experience, /if \(!entered\) return;/);
  assert.match(experience, /\{!entered && <BootScreen onEnter=\{\(\) => setEntered\(true\)\} \/>\}/);
  const mainIdx = experience.indexOf('<main className="experience"');
  const videoIdx = experience.indexOf("<video ref={videoRef}");
  const bootOverlayIdx = experience.indexOf("{!entered && <BootScreen");
  assert.ok(mainIdx > -1 && videoIdx > mainIdx && bootOverlayIdx > videoIdx);
  // No fake/simulated loading sequence — entering goes straight to the real
  // camera effect (gated only by `entered`, no artificial delay/timer).
  assert.doesNotMatch(bootScreen, /setTimeout|setInterval/);

  // Burn HUD + GRABBED toast are driven imperatively (direct DOM writes),
  // not via React state, so they don't cause a re-render on every frame.
  assert.match(experience, /burnFillRef\.current\.style\.transform = `scaleX\(\$\{burn\}\)`/);
  assert.match(experience, /const isHeld = snapshot\.cigaretteState !== "IDLE" && snapshot\.cigaretteState !== "FALLING"/);
  assert.match(experience, /if \(isHeld && !wasHeld && grabbedToastRef\.current\)/);
  assert.match(experience, /toast\.classList\.add\("is-visible"\)/);

  // Tracking/rendering call sites are untouched by this pass.
  assert.match(experience, /const snapshot = engine\.update\(face, hands, now, dt, delegate\)/);
  assert.match(experience, /visual\.update\(snapshot, face, now, dt, fps\)/);

  // Branding: VAPOR.exe throughout, old name retired from user-facing text.
  assert.match(bootScreen, /VAPOR<span className="boot-screen__ext">\.exe<\/span>/);
  assert.match(bootScreen, /CAMERA REQUIRED/);
  assert.match(page, /title: "VAPOR\.exe"/);
  assert.match(layout, /title: "VAPOR\.exe"/);
  assert.doesNotMatch(page, /Virtual Cigarette/);
  assert.doesNotMatch(layout, /Virtual Cigarette/);
  assert.match(controlPanel, /VAPOR\.exe \/\/ CONTROLS/);

  // Palette/typography: purple accent (not neon-flooded), pixel font scoped
  // narrowly via .pixel-text rather than applied globally.
  assert.match(css, /--vapor-purple: #a855f7/);
  assert.match(css, /Press\+Start\+2P/);
  assert.match(css, /\.pixel-text \{/);
  assert.doesNotMatch(css, /body \{[^}]*font-family: var\(--vapor-mono\)/s);

  // No new npm dependencies were added for this pass (font is loaded via a
  // plain CSS @import, not an installed package).
  const pkg = JSON.parse(packageJson);
  const deps = Object.keys(pkg.dependencies ?? {});
  assert.deepEqual(
    deps.sort(),
    [
      "@mediapipe/tasks-vision",
      "drizzle-orm",
      "react",
      "react-dom",
      "three",
      "zustand",
    ].sort(),
    "no new runtime dependencies should have been added for a frontend-only redesign",
  );

  // Safe-area handling preserved for the new HUD elements too.
  assert.match(css, /\.burn-hud \{[^}]*env\(safe-area-inset-left\)/s);
  assert.match(css, /\.grabbed-toast \{[^}]*env\(safe-area-inset-left\)/s);

  // Reduced-motion respected for every new animation.
  assert.match(css, /@media \(prefers-reduced-motion: reduce\) \{\s*\.boot-screen \{ animation: none; \}/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\) \{\s*\.grabbed-toast\.is-visible/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\) \{\s*\.burn-hud__fill/);
});

