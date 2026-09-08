"use client";

interface BootScreenProps {
  onEnter: () => void;
}

// The .exe-style launch screen shown before camera access is requested.
// Deliberately minimal — no fake loading sequence. Clicking ENTER
// immediately hands off to the real camera permission flow in
// smoking-experience.tsx; there is nothing simulated here.
export function BootScreen({ onEnter }: BootScreenProps) {
  return (
    <div className="boot-screen" role="dialog" aria-label="VAPOR.exe launch screen">
      <p className="boot-screen__sys pixel-text" aria-hidden="true">
        SYS // READY
      </p>
      <h1 className="boot-screen__title pixel-text">
        VAPOR<span className="boot-screen__ext">.exe</span>
      </h1>
      <p className="boot-screen__subtitle">A DIGITAL SMOKE EXPERIENCE</p>
      <button type="button" className="boot-screen__enter pixel-text" onClick={onEnter}>
        [ ENTER ]
      </button>
      <p className="boot-screen__requirement">CAMERA REQUIRED</p>
    </div>
  );
}
