// Smoke visual presets.
//
// A SmokePreset controls the smoke's color, opacity, turbulence, and blend
// mode via shader uniforms / material properties in smoke-renderer.ts,
// instead of those values being hardcoded directly into the GLSL.
// REALISTIC_PRESET encodes the exact values the shader used before the
// preset refactor (#696969 smoke, same opacity curve, same motion), so
// switching to preset-driven uniforms is a no-op visually.
//
// Additional presets can be added here later without touching the
// renderer's particle simulation or shader structure.

export interface SmokePreset {
  name: string;
  /** Smoke color as normalized [r, g, b] (0..1). */
  color: [number, number, number];
  /** Base opacity for ember/tip smoke particles (aKind 0). */
  tipOpacity: number;
  /** Base opacity for mouth and nose burst particles (aKind 1 and 2). */
  burstOpacity: number;
  /** Extra opacity added on top of burstOpacity for nose-burst particles only (aKind 2). */
  noseOpacityBonus: number;
  /** Color of falling ash flecks (aKind 3), as normalized [r, g, b] (0..1). */
  ashColor: [number, number, number];
  /** Base opacity for ash flecks — ash renders as a mostly-solid disc, not a wispy cloud. */
  ashOpacity: number;
  /** Multiplier on the vertex shader's curl/turbulence terms. 1 = Realistic's original amount. */
  turbulenceScale: number;
  /** Material blend mode. "additive" is for bright/glowing styles (e.g. Neon); everything else uses "normal". */
  blending: "normal" | "additive";
}

export const REALISTIC_PRESET: SmokePreset = {
  name: "REALISTIC",
  color: [0.4117647, 0.4117647, 0.4117647],
  tipOpacity: 0.068,
  burstOpacity: 0.055,
  noseOpacityBonus: 0.007,
  // Matches the cigarette's static ash-buildup mesh color (#77736b).
  ashColor: [0.4666667, 0.4509804, 0.4196078],
  ashOpacity: 0.85,
  turbulenceScale: 1,
  blending: "normal",
};

export const CINEMATIC_PRESET: SmokePreset = {
  name: "CINEMATIC",
  color: [0.24, 0.24, 0.26],
  tipOpacity: 0.09,
  burstOpacity: 0.075,
  noseOpacityBonus: 0.01,
  ashColor: [0.3, 0.28, 0.26],
  ashOpacity: 0.9,
  turbulenceScale: 0.7,
  blending: "normal",
};

export const GHOSTLY_PRESET: SmokePreset = {
  name: "GHOSTLY",
  color: [0.85, 0.87, 0.9],
  tipOpacity: 0.045,
  burstOpacity: 0.035,
  noseOpacityBonus: 0.004,
  ashColor: [0.6, 0.6, 0.6],
  ashOpacity: 0.5,
  turbulenceScale: 0.55,
  blending: "normal",
};

export const NEON_PRESET: SmokePreset = {
  name: "NEON",
  color: [0.25, 0.95, 1.0],
  tipOpacity: 0.075,
  burstOpacity: 0.06,
  noseOpacityBonus: 0.008,
  ashColor: [1.0, 0.35, 0.85],
  ashOpacity: 0.8,
  turbulenceScale: 1.25,
  blending: "additive",
};

export const DENSE_PRESET: SmokePreset = {
  name: "DENSE",
  color: [0.35, 0.35, 0.35],
  tipOpacity: 0.12,
  burstOpacity: 0.1,
  noseOpacityBonus: 0.012,
  ashColor: [0.4, 0.38, 0.35],
  ashOpacity: 0.95,
  turbulenceScale: 0.85,
  blending: "normal",
};

/** All built-in presets, for UI listing (e.g. a style picker in a later phase). */
export const SMOKE_PRESETS: readonly SmokePreset[] = [
  REALISTIC_PRESET,
  CINEMATIC_PRESET,
  GHOSTLY_PRESET,
  NEON_PRESET,
  DENSE_PRESET,
];
