// Centralized tunable constants.
//
// These values were previously hardcoded as module-level consts directly
// inside interaction-engine.ts and smoke-renderer.ts. They are extracted here
// unchanged so they can be found and adjusted in one place. This file
// introduces no behavior changes on its own.

// --- Cigarette geometry & burn timing (used by interaction-engine.ts) ---

/** Cigarette base length as a fraction of detected face width. */
export const CIGARETTE_FACE_SCALE = 0.275;
/** Minimum cigarette base length, in normalized (0..1) video-space units. */
export const CIGARETTE_MIN_LENGTH = 0.0475;
/** Maximum cigarette base length, in normalized (0..1) video-space units. */
export const CIGARETTE_MAX_LENGTH = 0.1025;
/** Fraction of the base length still visible once fully burned down. */
export const MIN_LENGTH_RATIO = 0.28;
/** Total accumulated inhale seconds (~7 puffs @ 1.4s) before the cigarette is fully burned. */
export const FULL_BURN_SECONDS = 7 * 1.4;
/** Minimum inhale duration, in seconds, for a puff to count toward a smoke burst. */
export const MIN_INHALE_SECONDS = 0.25;
/** Delay, in milliseconds, before a pending exhale switches from mouth to nose. */
export const NOSE_EXHALE_DELAY_MS = 3000;
/** How long a transient smoking-state label (e.g. MOUTH_BURST) is held, in milliseconds. */
export const EFFECT_LABEL_MS = 900;

// --- Particle system sizing (used by smoke-renderer.ts) ---

/** Size of the GPU particle ring buffer (all smoke kinds share this pool). */
export const MAX_PARTICLES = 8000;
/** Multiplier applied to burst particle counts (mouth/nose exhale volume). */
export const SMOKE_VOLUME_MULTIPLIER = 5;
/** Upper bound applied to window.devicePixelRatio when sizing the renderer. */
export const PIXEL_RATIO_CAP = 1.5;

// --- Adaptive render-quality thresholds (used by smoke-renderer.ts) ---

/** FPS below which sustained low performance starts counting down toward a quality drop. */
export const QUALITY_DROP_FPS = 42;
/** FPS above which sustained good performance starts counting up toward a quality recovery. */
export const QUALITY_RECOVER_FPS = 54;
/** Seconds of sustained low FPS required before dropping one quality tier. */
export const QUALITY_DROP_SECONDS = 1.5;
/** Seconds of sustained high FPS required before recovering one quality tier. */
export const QUALITY_RECOVER_SECONDS = 4;

// --- Ash particle spawning (used by smoke-renderer.ts, added in P1) ---

/** Particles per second of falling ash spawned from the ember while actively burning. */
export const ASH_SPAWN_RATE = 4;
