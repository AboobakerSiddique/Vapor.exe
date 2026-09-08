"use client";

import { useEffect, useState } from "react";
import { SMOKE_PRESETS } from "../lib/smoke-presets";
import { useSettingsStore } from "../lib/settings-store";

// Floating glass control panel. Collapsed to a single FAB by default so it
// never obstructs the camera view (progressive disclosure) — the person
// taps it open to reveal style/intensity/wind/sensitivity controls plus
// camera-flip, fullscreen, reset, and help.

function toggleFullscreen() {
  if (document.fullscreenElement) {
    void document.exitFullscreen();
  } else {
    void document.documentElement.requestFullscreen().catch(() => {
      // Fullscreen can be denied by the browser/OS (e.g. no user gesture,
      // or unsupported) — fail silently rather than showing an error for a
      // non-essential convenience feature.
    });
  }
}

export function ControlPanel() {
  const {
    preset,
    intensity,
    windStrength,
    sensitivity,
    mirrored,
    panelOpen,
    helpOpen,
    setPreset,
    setIntensity,
    setWindStrength,
    setSensitivity,
    toggleMirrored,
    togglePanel,
    toggleHelp,
    reset,
  } = useSettingsStore();
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  return (
    <>
      <button
        type="button"
        className="control-fab"
        aria-expanded={panelOpen}
        aria-label={panelOpen ? "Close controls" : "Open controls"}
        onClick={togglePanel}
      >
        {panelOpen ? "X" : "//"}
      </button>

      {panelOpen && (
        <section className="control-panel" aria-label="VAPOR.exe controls">
          <p className="control-panel__heading">VAPOR.exe // CONTROLS</p>
          <div className="control-group">
            <span className="control-label">Style</span>
            <div className="control-pills">
              {SMOKE_PRESETS.map((option) => (
                <button
                  key={option.name}
                  type="button"
                  className="control-pill"
                  data-active={option.name === preset.name}
                  onClick={() => setPreset(option)}
                >
                  {option.name[0]}
                  {option.name.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>

          <label className="control-group">
            <span className="control-label">Intensity</span>
            <input
              type="range"
              min={0.5}
              max={1.5}
              step={0.05}
              value={intensity}
              onChange={(event) => setIntensity(Number(event.target.value))}
            />
          </label>

          <label className="control-group">
            <span className="control-label">Wind</span>
            <input
              type="range"
              min={-1}
              max={1}
              step={0.05}
              value={windStrength}
              onChange={(event) => setWindStrength(Number(event.target.value))}
            />
          </label>

          <label className="control-group">
            <span className="control-label">Sensitivity</span>
            <input
              type="range"
              min={0.5}
              max={1.75}
              step={0.05}
              value={sensitivity}
              onChange={(event) => setSensitivity(Number(event.target.value))}
            />
          </label>

          <div className="control-actions">
            <button type="button" onClick={toggleMirrored} aria-pressed={!mirrored}>
              {mirrored ? "MIRRORED" : "TRUE VIEW"}
            </button>
            <button type="button" onClick={toggleFullscreen} aria-pressed={isFullscreen}>
              FULLSCREEN
            </button>
            <button type="button" onClick={reset}>
              RESET
            </button>
            <button type="button" onClick={toggleHelp} aria-pressed={helpOpen}>
              HELP
            </button>
          </div>
        </section>
      )}

      {helpOpen && (
        <section className="help-overlay" role="dialog" aria-label="How VAPOR.exe works">
          <h2>VAPOR.exe // HELP</h2>
          <ul>
            <li>Pinch your thumb and index finger to pick up the cigarette.</li>
            <li>Bring it toward your mouth and purse your lips to inhale.</li>
            <li>Open your mouth to exhale — or wait, and it exhales through your nose.</li>
            <li>The cigarette burns down with each puff and eventually falls.</li>
          </ul>
          <button type="button" onClick={toggleHelp}>
            [ GOT IT ]
          </button>
        </section>
      )}
    </>
  );
}
