# VAPOR.exe

> **An interactive browser-based AR smoke experience powered by real-time hand and face tracking.**

VAPOR.exe is a real-time browser experience that combines **webcam-based hand and face tracking, interactive 3D rendering, procedural smoke effects, and gesture-driven interaction**.

Instead of simply displaying a virtual object on screen, VAPOR.exe lets you interact with a virtual cigarette using your hand and facial movements. Pinch it, bring it toward your mouth, inhale, exhale, and watch the cigarette burn down while procedural smoke reacts dynamically around you.

Built for the browser using **TypeScript, React, MediaPipe, Three.js, WebGL, and GLSL**.

---

## ✦ Features

### 🖐 Real-Time Hand Interaction

VAPOR.exe tracks your hand through your webcam and allows you to interact with the virtual cigarette naturally.

* Pinch/grab interaction
* Hand proximity detection
* Adjustable interaction sensitivity
* Real-time cigarette positioning
* Gesture-based interaction without physical controllers

---

### 👄 Face & Mouth Tracking

The experience uses real-time facial landmarks to detect interactions with the cigarette.

* Mouth proximity detection
* Inhale interaction
* Mouth-opening detection
* Exhale interaction
* Nose-related smoke behavior
* Real-time facial landmark processing

The camera feed and tracking are processed locally in the browser.

---

## 🚬 Interactive Cigarette System

The cigarette is not simply a static 3D model.

Its state changes dynamically based on your interactions.

### Basic interaction flow

1. Pinch the virtual cigarette.
2. Move it toward your mouth.
3. Hold it near your mouth to trigger the inhale interaction.
4. The cigarette progressively burns.
5. Smoke is generated from the cigarette.
6. Open your mouth to trigger an exhale smoke burst.
7. Additional smoke behavior can occur around the nose.
8. Continue interacting until the cigarette burns down.
9. Once fully burned, the cigarette falls away.

The interaction engine controls these states in real time.

---

# 🌫 Procedural Smoke

VAPOR.exe uses GPU-rendered procedural smoke rather than relying entirely on pre-rendered animations.

The smoke system is built with **Three.js and custom WebGL/GLSL shader logic**.

The renderer supports multiple visual presets.

### Available presets

* **Realistic**
* **Cinematic**
* **Ghostly**
* **Neon**
* **Dense**

Each preset can control characteristics such as:

* Smoke color
* Tip opacity
* Burst opacity
* Nose smoke intensity
* Ash appearance
* Ash opacity
* Turbulence
* Blending mode

The system also supports wind-driven smoke movement.

---

# 💨 Wind System

Smoke can respond to configurable wind strength and direction.

Wind affects the procedural smoke movement while keeping other interaction behavior intact.

This allows the smoke to feel less static and more physically dynamic.

---

# 🔥 Burn & Ash Effects

The cigarette gradually burns during the inhale interaction.

As it burns:

* The cigarette shortens
* Smoke is emitted
* Ash can spawn
* Ash falls under gravity
* Ash can tumble and shrink
* The cigarette eventually reaches its fully-burned state

Ash particles are treated separately from smoke and respond differently to environmental forces.

---

# 🎛 VAPOR.exe Control Panel

VAPOR.exe includes a minimal floating glass-style interface designed to stay out of the way of the camera experience.

The control panel is **collapsed by default** and can be opened using a floating action button.

### Controls

#### Smoke Style

Choose between the available smoke presets:

* Realistic
* Cinematic
* Ghostly
* Neon
* Dense

#### Smoke Intensity

Adjust the overall smoke opacity independently of the selected visual preset.

#### Wind

Adjust the environmental wind strength affecting smoke movement.

#### Sensitivity

Adjust hand interaction sensitivity.

Higher sensitivity provides a larger interaction/proximity range, while lower sensitivity requires more precise positioning.

#### Camera Flip

Toggle the camera presentation between mirrored and non-mirrored modes.

The camera flip is implemented as a presentation-layer transformation without modifying the underlying tracking coordinate calculations.

#### Fullscreen

Enter fullscreen mode for a more immersive experience.

The fullscreen state synchronizes with the browser's actual fullscreen state, including exiting fullscreen with `Escape`.

#### Reset

Restore the experience settings to their defaults.

#### Help

Open the built-in interaction instructions.

---

# 📱 Mobile Support

VAPOR.exe is designed to work in modern mobile browsers capable of accessing the device camera.

You can run the development server on your computer and access it from a phone on the same local network.

Example:

```text
http://YOUR-COMPUTER-IP:3000
```

For example:

```text
http://192.168.1.6:3000
```

> Camera permissions and browser security policies can affect camera access, particularly when using an unsecured HTTP connection on mobile devices. Production deployments should use HTTPS.

---

# ⚡ Adaptive Performance

VAPOR.exe includes adaptive performance behavior intended to maintain a smoother experience across different hardware.

The smoke renderer monitors performance and can adjust rendering quality based on observed frame rate.

Tracking performance is also connected to the renderer's quality tier.

### Performance modes

The tracking system supports:

* **HIGH** — process every new frame
* **MEDIUM** — process every second new frame
* **LOW** — process every third new frame

Duplicate video frames are ignored before the throttle is applied.

This prevents unnecessary MediaPipe inference when the camera has not produced a genuinely new frame.

---

# 🧠 Tracking Architecture

The application combines several systems:

```text
                 Webcam
                    │
                    ▼
          ┌───────────────────┐
          │   MediaPipe       │
          │ Hand + Face       │
          │ Tracking          │
          └─────────┬─────────┘
                    │
                    ▼
          ┌───────────────────┐
          │ Vision Tracker    │
          └─────────┬─────────┘
                    │
                    ▼
          ┌───────────────────┐
          │ Interaction       │
          │ Engine            │
          └─────────┬─────────┘
                    │
                    ▼
       ┌─────────────────────────┐
       │ Three.js / WebGL        │
       │ Smoke + Cigarette       │
       │ Rendering               │
       └────────────┬────────────┘
                    │
                    ▼
              Final Camera View
```

---

# 🏗 Project Architecture

The project is primarily organized around the following systems:

```text
app/
├── controls/
│   └── control-panel.tsx
│
├── lib/
│   ├── config.ts
│   ├── interaction-engine.ts
│   ├── settings-store.ts
│   ├── smoke-presets.ts
│   ├── smoke-renderer.ts
│   └── vision-tracker.ts
│
├── smoking-experience.tsx
├── globals.css
└── layout.tsx

public/
└── mediapipe/

tests/
└── rendered-html.test.mjs

scripts/
└── fetch-mediapipe-assets.mjs

.github/
└── workflows/
    └── ci.yml

LICENSE
NOTICE.md
README.md
package.json
```

---

# 🛠 Tech Stack

| Technology      | Purpose                                        |
| --------------- | ---------------------------------------------- |
| **TypeScript**  | Application logic and type safety              |
| **React**       | User interface and application components      |
| **Three.js**    | 3D rendering                                   |
| **WebGL**       | GPU-accelerated graphics                       |
| **GLSL**        | Procedural smoke shaders                       |
| **MediaPipe**   | Hand and face tracking                         |
| **CSS**         | UI, camera presentation and responsive styling |
| **Zustand**     | Lightweight state management                   |
| **Vite/Vinext** | Development and application tooling            |

---

# 📋 Requirements

Before running VAPOR.exe locally, make sure you have:

* **Node.js 22.13+**
* **npm**
* A webcam
* A modern browser

Recommended browsers:

* Google Chrome
* Microsoft Edge
* Modern mobile Chrome/Safari where camera access is supported

---

# 🚀 Installation

Clone the repository:

```bash
git clone YOUR_REPOSITORY_URL
```

Enter the project directory:

```bash
cd VAPOR.exe
```

Install dependencies:

```bash
npm install
```

---

# ▶️ Development

Start the development server:

```bash
npm run dev
```

The application should become available at:

```text
http://localhost:3000
```

Open the URL in a supported browser and grant camera permission.

---

# 📱 Running on a Phone

To access the development server from another device on the same Wi-Fi network:

```bash
npm run dev -- --host 0.0.0.0 --port 3000
```

Find your computer's local IP address.

On Windows:

```bash
ipconfig
```

Look for the IPv4 address of your active Wi-Fi adapter.

Then open the following on your phone:

```text
http://YOUR-COMPUTER-IP:3000
```

Example:

```text
http://192.168.1.6:3000
```

Both devices must be connected to the same local network.

> If the browser refuses camera access over local HTTP, use an HTTPS development setup or a secure deployment/tunnel.

---

# 🧪 Testing

Run the project's test suite:

```bash
npm test
```

Run the production build:

```bash
npm run build
```

Run TypeScript checking:

```bash
npx tsc --noEmit
```

Run linting:

```bash
npm run lint
```

---

# 📦 MediaPipe Assets

The project uses MediaPipe runtime/model assets.

A helper script is provided for fetching the required MediaPipe assets:

```bash
npm run fetch:mediapipe
```

The repository currently retains the existing vendored MediaPipe assets.

The fetch script is intentionally **not automatically connected to `dev` or `build`** because asset downloading should not silently become a required network operation during normal development.

If you choose to remove the vendored assets in the future, verify that the fetch process works correctly in your deployment/build environment first.

---

# 🔒 Privacy

VAPOR.exe uses the device camera for real-time interaction tracking.

The camera feed is processed locally by the browser for the tracking experience.

The project is designed around local real-time processing rather than uploading or storing camera footage.

Users should still review the deployment environment and browser permissions before using the application.

---

# 🎨 Design Philosophy

VAPOR.exe is designed around a combination of:

* Y2K-inspired digital aesthetics
* Futuristic interfaces
* Minimal glass UI
* Real-time visual effects
* Interactive camera experiences
* Dark atmospheric visuals
* Procedural graphics
* Experimental browser technology

The interface intentionally stays minimal so the camera experience remains the primary focus.

---

# ⚙️ Configuration

Core rendering and interaction constants are centralized in:

```text
app/lib/config.ts
```

Smoke visual presets are defined in:

```text
app/lib/smoke-presets.ts
```

User-facing settings are managed through:

```text
app/lib/settings-store.ts
```

The interaction system is located in:

```text
app/lib/interaction-engine.ts
```

The procedural smoke renderer is located in:

```text
app/lib/smoke-renderer.ts
```

Camera and MediaPipe processing is handled through:

```text
app/lib/vision-tracker.ts
```

---

# 🧩 Development Roadmap

The project has gone through several development phases.

### P0 — Architecture & Configuration

* Centralized rendering/interaction configuration
* Smoke preset architecture
* Renderer uniform abstraction
* Interaction-engine cleanup
* Regression testing

### P1 — Advanced Smoke

* Multiple smoke presets
* Wind controls
* Turbulence controls
* Ash particles
* Ash physics
* Smoke blending modes

### P2 — User Interface

* Floating glass control panel
* Smoke preset selector
* Intensity control
* Wind control
* Sensitivity control
* Camera flip
* Fullscreen
* Reset
* Help
* Camera/tracking status feedback
* Camera permission retry

### P3 — Advanced Visual Effects

Reserved for future advanced visual-effect development.

### P4 — Performance & Mobile

* Adaptive MediaPipe inference throttling
* HIGH/MEDIUM/LOW performance modes
* Renderer/tracker quality synchronization
* Mobile safe-area support
* Notch-aware UI positioning

### P5 — Release Preparation

* Documentation
* Attribution
* CI
* MediaPipe asset management
* Release-readiness improvements

---

# 🧪 Current Status

**VAPOR.exe is currently a release candidate pending real-world browser and device verification.**

Automated and code-level validation has been performed across the development phases, including:

* Syntax validation
* JSX/TSX bundling
* TypeScript checks
* Behavioral interaction tests
* Smoke shader validation
* Performance-throttle validation
* Whitebox tests
* Regression checks
* CI/YAML validation

However, the development environment used during implementation did not have functional network access, so the complete real-world installation/build flow could not be verified there.

Before considering the project production-ready, run:

```bash
npm install
npm test
npm run build
npm run dev
```

and test the application in an actual browser and on an actual mobile device.

---

# 📜 License

VAPOR.exe is based on the open-source **Virtual Smoke** project.

The original project's MIT License is preserved in:

```text
LICENSE
```

Additional attribution and third-party licensing information is available in:

```text
NOTICE.md
```

Please retain the required copyright and license notices when redistributing modified versions of the project.

---

# 🙏 Credits

VAPOR.exe builds upon open-source technologies and assets including:

* The original **Virtual Smoke** project
* MediaPipe
* Three.js
* React
* TypeScript
* WebGL
* GLSL

See `NOTICE.md` for detailed attribution and licensing information.

---

# ⚠️ Disclaimer

VAPOR.exe is an experimental interactive visual-effects project.

The virtual cigarette and smoke are digital visual effects intended for an interactive AR experience.

VAPOR.exe does not provide medical, health, or smoking advice.

---

# 🌐 Browser Experience

VAPOR.exe is designed to be experienced directly through a modern web browser.

No dedicated native application is required.

The core interaction loop is:

```text
CAMERA
   ↓
HAND + FACE TRACKING
   ↓
GESTURE DETECTION
   ↓
INTERACTION ENGINE
   ↓
CIGARETTE STATE
   ↓
PROCEDURAL SMOKE
   ↓
REAL-TIME WEBGL
   ↓
VAPOR.exe
```

---

## VAPOR.exe

**Touch nothing.
Just move.
Inhale.
Exhale.
Watch the vapor.**
