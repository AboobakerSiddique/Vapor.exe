import { create } from "zustand";
import { REALISTIC_PRESET, type SmokePreset } from "./smoke-presets";

// User-facing settings (control panel), as distinct from useInteractionStore
// in store.ts, which holds ephemeral runtime/debug diagnostics. This store
// holds things the person deliberately chose and would expect to persist
// for the rest of the session: smoke style, intensity, wind, tracking
// sensitivity, mirror mode, and panel/help visibility.

const DEFAULT_INTENSITY = 1;
const DEFAULT_WIND_STRENGTH = 0;
const DEFAULT_SENSITIVITY = 1;
const DEFAULT_MIRRORED = true;

export interface SettingsState {
  preset: SmokePreset;
  /** 0.5 (light) to 1.5 (heavy), multiplies overall smoke opacity. */
  intensity: number;
  /** -1 (wind from the right) to 1 (wind from the left), 0 = still air. */
  windStrength: number;
  /** 0.5 (less sensitive/more deliberate) to 1.75 (more sensitive/easier to grab). */
  sensitivity: number;
  /** Whether the whole composited view (camera + overlay) is shown mirrored (selfie-style). */
  mirrored: boolean;
  panelOpen: boolean;
  helpOpen: boolean;
  setPreset: (preset: SmokePreset) => void;
  setIntensity: (value: number) => void;
  setWindStrength: (value: number) => void;
  setSensitivity: (value: number) => void;
  toggleMirrored: () => void;
  togglePanel: () => void;
  toggleHelp: () => void;
  reset: () => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  preset: REALISTIC_PRESET,
  intensity: DEFAULT_INTENSITY,
  windStrength: DEFAULT_WIND_STRENGTH,
  sensitivity: DEFAULT_SENSITIVITY,
  mirrored: DEFAULT_MIRRORED,
  panelOpen: false,
  helpOpen: false,
  setPreset: (preset) => set({ preset }),
  setIntensity: (value) => set({ intensity: value }),
  setWindStrength: (value) => set({ windStrength: value }),
  setSensitivity: (value) => set({ sensitivity: value }),
  toggleMirrored: () => set((state) => ({ mirrored: !state.mirrored })),
  togglePanel: () => set((state) => ({ panelOpen: !state.panelOpen })),
  toggleHelp: () => set((state) => ({ helpOpen: !state.helpOpen })),
  reset: () =>
    set({
      preset: REALISTIC_PRESET,
      intensity: DEFAULT_INTENSITY,
      windStrength: DEFAULT_WIND_STRENGTH,
      sensitivity: DEFAULT_SENSITIVITY,
      mirrored: DEFAULT_MIRRORED,
    }),
}));
