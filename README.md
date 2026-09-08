# VAPOR.exe

> **A browser-based AR smoking simulation powered by hand tracking, face tracking, WebGL, and real-time procedural smoke.**

VAPOR.exe is an experimental browser experience that turns your webcam into an interactive augmented-reality environment.

Use your **hand to grab a virtual cigarette**, bring it toward your mouth, inhale, and exhale to create real-time smoke effects. The experience combines MediaPipe tracking with a custom WebGL smoke renderer and a Y2K / PS2-era inspired interface.

No installation is required for the deployed version — just open the website, allow camera access, and enter the experience.

---

## 🌐 Live

### Production

**Live URL:**
`[YOUR_LIVE_URL_HERE]`

### Repository

**GitHub:**
`[https://github.com/AboobakerSiddique/Vapor.exe]`



---

## ✦ Features

### 🖐️ Hand Tracking

Use your webcam to control the virtual cigarette.

* Pinch your fingers to grab the cigarette
* Move your hand naturally through the camera view
* Release the pinch to drop it
* Real-time hand landmark tracking
* Adjustable tracking sensitivity

When the cigarette is successfully grabbed, a small **`GRABBED`** indicator appears on the HUD.

---

### 👄 Face & Mouth Interaction

VAPOR.exe uses face tracking to detect interaction with the virtual cigarette.

Bring the cigarette toward your mouth and use your facial movements to interact with the simulation.

The system can detect:

* Mouth position
* Mouth opening
* Lip movement / pursing
* Relative cigarette-to-mouth positioning

These interactions drive the inhale and exhale effects.

---

### 💨 Procedural Smoke

Smoke is generated in real time using a custom WebGL renderer.

The smoke system includes:

* Procedural smoke particles
* Turbulence
* Wind influence
* Dynamic movement
* Multiple smoke presets
* Intensity control
* Smoke blending
* Ash particles
* Cigarette burn progression

Smoke behavior is simulated locally in the browser rather than generated from pre-rendered video.

---

### 🔥 Cigarette Burn System

The virtual cigarette progressively burns during the experience.

The interface includes a visual burn indicator so you can see the cigarette's current state.

As the cigarette reaches the end of its lifecycle, it can burn out and fall from the interaction point.

---

## 🎮 Visual Experience

VAPOR.exe uses a visual language inspired by:

* Y2K cyber aesthetics
* PS2-era game interfaces
* Early digital camera / game HUD design
* Dark futuristic UI
* Minimal cyberpunk interfaces

The interface uses a predominantly **black and purple** palette with pixel-inspired typography and restrained visual effects.

The goal is to make the application feel more like an interactive game than a conventional web application.

---

## 🖥️ Interface

### Boot Screen

The experience begins with a minimal executable-style launch screen.

```text
VAPOR.exe

[ ENTER ]

CAMERA REQUIRED
```

There is no artificial loading animation or fake progress bar.

The application initializes the actual experience underneath the boot interface.

---

### Camera HUD

Once inside the experience, a game-style HUD provides information about the current interaction state.

The HUD can communicate:

* Camera status
* Tracking state
* Cigarette interaction
* Burn progression
* System information

The HUD is intentionally kept lightweight so that it doesn't interfere with the AR experience.

---

### Control Panel

The floating control panel provides access to:

* Smoke preset
* Smoke intensity
* Wind strength
* Tracking sensitivity
* Camera mirroring
* Fullscreen mode
* Reset
* Help

The panel is collapsed by default to keep the main experience clean.

---

## 🎨 Smoke Presets

VAPOR.exe includes multiple visual smoke styles.

| Preset        | Description                                  |
| ------------- | -------------------------------------------- |
| **Realistic** | Natural-looking smoke with balanced movement |
| **Cinematic** | Softer, more dramatic smoke behavior         |
| **Ghostly**   | Light and atmospheric smoke                  |
| **Neon**      | Stylized futuristic smoke                    |
| **Dense**     | Stronger and heavier smoke output            |

The preset system is designed so additional smoke styles can be added without changing the core interaction system.

---

## ⚙️ Controls

### Smoke Intensity

Controls the overall amount and visual strength of generated smoke.

### Wind

Controls the directional influence applied to smoke and particles.

### Sensitivity

Adjusts how responsive hand interaction is to tracked movement.

### Camera Flip

Mirrors the camera view for a more natural selfie-style experience.

### Fullscreen

Expands the experience to fullscreen when supported by the browser.

### Reset

Returns configurable experience settings to their defaults.

### Help

Displays basic instructions for interacting with VAPOR.exe.

---

## 🕹️ Interaction Flow

The basic experience works like this:

```text
        WEBCAM
           │
           ▼
   ┌─────────────────┐
   │ Hand Tracking   │
   │ Face Tracking   │
   └────────┬────────┘
            │
            ▼
      Find Cigarette
            │
            ▼
       Pinch / Grab
            │
            ▼
         GRABBED
            │
            ▼
      Move Toward Mouth
            │
            ▼
       Inhale / Burn
            │
            ▼
       Smoke Generated
            │
            ▼
        Exhale / Smoke
            │
            ▼
       Cigarette Burns
            │
            ▼
          End State
```

---

## 📱 Mobile Support

VAPOR.exe is designed to work on both desktop and mobile browsers.

The interface adapts to:

* Portrait orientation
* Landscape orientation
* Smaller screens
* Touch interaction
* Mobile safe areas
* Camera viewport constraints
* Fullscreen layouts

The visual experience prioritizes the camera feed and interaction area while keeping controls accessible.

### Recommended Mobile Browser

For the best experience, use a modern version of:

* Google Chrome
* Microsoft Edge
* Safari

Camera permissions must be granted for AR interaction to function.

---

## 🚀 Performance

VAPOR.exe includes adaptive performance behavior for different devices.

The vision-tracking system supports three performance levels:

```text
HIGH
MEDIUM
LOW
```

Tracking frequency can be reduced on less powerful devices to help maintain a smoother rendering experience.

Visual quality can also adapt independently of tracking performance.

This helps balance:

```text
Tracking Accuracy
        +
Rendering Quality
        +
Frame Rate
```

rather than forcing every device to run the same workload.

---

## 🔒 Privacy

VAPOR.exe is designed around local browser processing.

Camera frames are processed locally by the browser for the tracking experience.

The application does **not intentionally upload or store your camera footage** as part of the core experience.

Camera access is only required because the application needs the webcam to perform:

* Hand tracking
* Face tracking
* Interaction detection

You can revoke camera permission through your browser at any time.

> Always review the deployed application's actual network behavior before making privacy claims for a production release.

---

## 🧠 Technology

VAPOR.exe is built using modern browser technologies.

### Core

* TypeScript
* React
* Vite / Vinext
* WebGL
* GLSL

### Computer Vision

* MediaPipe Hand Tracking
* MediaPipe Face Tracking

### Rendering

* Three.js
* Custom WebGL / GLSL smoke rendering
* Procedural particle effects

### Interface

* React components
* CSS
* Responsive layouts
* Pixel-inspired typography
* Game-style HUD

---

## 📁 Project Structure

A simplified overview of the project:

```text
VAPOR.exe/
│
├── app/
│   ├── boot/
│   │   └── boot-screen.tsx
│   │
│   ├── controls/
│   │   └── control-panel.tsx
│   │
│   ├── lib/
│   │   ├── config.ts
│   │   ├── settings-store.ts
│   │   └── smoke-presets.ts
│   │
│   ├── ...
│   │
│   ├── smoking-experience.tsx
│   ├── page.tsx
│   ├── layout.tsx
│   └── globals.css
│
├── public/
│   └── mediapipe/
│
├── scripts/
│   └── fetch-mediapipe-assets.mjs
│
├── tests/
│
├── .github/
│   └── workflows/
│       └── ci.yml
│
├── LICENSE
├── NOTICE.md
├── package.json
├── package-lock.json
└── README.md
```

---

## 🛠️ Local Development

### Requirements

You should have:

* Node.js **22.13+**
* npm
* A working webcam
* A modern Chromium-based browser or Safari

---

### Clone the Repository

```bash
git clone [YOUR_GITHUB_REPOSITORY_URL_HERE]
cd VAPOR.exe
```

---

### Install Dependencies

```bash
npm install
```

---

### Start Development Server

```bash
npm run dev
```

The development server should be available at:

```text
http://localhost:3000
```

To expose the development server to other devices on your local network:

```bash
npm run dev -- --host 0.0.0.0
```

Then access the application using your computer's local network IP.

> Camera permissions may behave differently on non-HTTPS local network URLs depending on the browser. A production HTTPS deployment is recommended for testing the complete mobile experience.

---

## 🧪 Testing

Run the project's test suite with:

```bash
npm test
```

Before deployment, also run:

```bash
npm run build
```

A successful production build should complete without errors.

---

## 🧩 MediaPipe Assets

The project uses locally available MediaPipe assets for its tracking pipeline.

A helper script is included for fetching the required assets:

```bash
npm run fetch:mediapipe
```

This can be useful when preparing a fresh environment or updating the vendored assets.

Depending on the project's deployment configuration, ensure that all required runtime assets are available under the expected public paths before deploying.

---

## 🎛️ Configuration

Centralized configuration values are maintained in:

```text
app/lib/config.ts
```

This keeps important interaction and rendering values out of the individual systems.

Examples include:

* Interaction thresholds
* Tracking parameters
* Smoke parameters
* Ash behavior
* Wind
* Burn behavior
* Performance-related values

---

## 🌫️ Smoke Architecture

The smoke system is separated from the interaction system.

Conceptually:

```text
Interaction Engine
       │
       ├── Cigarette Position
       ├── Inhale State
       ├── Exhale State
       └── Burn State
              │
              ▼
       Smoke Renderer
              │
       ┌──────┴──────┐
       ▼             ▼
    Smoke          Ash
  Particles      Particles
       │             │
       └──────┬──────┘
              ▼
          WebGL / GLSL
```

This separation makes it possible to modify the visual smoke system without rewriting the core AR interaction logic.

---

## 🔧 Settings Architecture

User preferences are managed through a dedicated settings store.

The current settings system includes:

```text
Preset
Intensity
Wind Strength
Sensitivity
Mirrored Camera
Panel State
Help State
```

Settings can be updated by the UI without directly coupling the controls to the rendering implementation.

---

## 🖥️ Browser Compatibility

VAPOR.exe requires browser support for:

* Webcam access
* WebGL
* JavaScript modules
* Modern React/browser APIs
* MediaPipe runtime requirements

Recommended:

| Platform | Browser                |
| -------- | ---------------------- |
| Windows  | Chrome / Edge          |
| macOS    | Chrome / Safari / Edge |
| Android  | Chrome                 |
| iOS      | Safari                 |
| Linux    | Chrome / Chromium      |

Actual performance and tracking quality will vary significantly depending on the device.

---

## ⚠️ Limitations

VAPOR.exe is an experimental interactive project.

Performance may vary based on:

* Device CPU/GPU
* Camera quality
* Lighting conditions
* Browser implementation
* Screen resolution
* Number of visible particles
* MediaPipe tracking performance

Tracking can become less reliable in:

* Very dark environments
* Extremely bright environments
* Poor camera quality
* Heavy motion blur
* Occluded hands
* Faces partially outside the camera frame

For best results:

1. Use a well-lit environment.
2. Keep your face visible.
3. Keep your hand within the camera frame.
4. Avoid excessive motion blur.
5. Use a modern device with WebGL support.

---

## 🔐 Permissions

The application requires camera access.

When prompted by the browser:

```text
Allow Camera → Enter Experience
```

If permission is denied, camera functionality will not work.

You can reset camera permissions through your browser's site settings.

---

## 📜 License

This project is released under the **MIT License**.

See:

```text
LICENSE
```

for the complete license text.

---

## 🙏 Credits & Attribution

VAPOR.exe builds upon open-source technologies and assets.

### Virtual Smoke

The project originated from / is based on the **Virtual Smoke** project by KwonTaeJunDS.

Original repository:

`https://github.com/KwonTaeJunDS/Virtual_Smoke`

The original project is licensed under the MIT License.

See `NOTICE.md` for attribution details.

### MediaPipe

Hand and face tracking functionality uses Google's MediaPipe technology.

MediaPipe is distributed under its applicable open-source license.

See:

```text
NOTICE.md
```

for additional attribution information.

---

## ⚖️ Disclaimer

VAPOR.exe is an **interactive visual simulation** created for experimentation and entertainment.

It does not involve real tobacco, nicotine, smoke, or combustion.

The virtual cigarette and smoking effects are purely digital.

The project should not be interpreted as an endorsement of smoking or tobacco use.

---

## 🗺️ Roadmap

Potential future improvements include:

* [ ] More realistic smoke simulation
* [ ] Additional smoke presets
* [ ] Improved mobile performance
* [ ] Better low-light tracking
* [ ] Additional interaction gestures
* [ ] More environmental effects
* [ ] Audio-reactive smoke
* [ ] Additional visual themes
* [ ] Improved accessibility
* [ ] Better device-specific quality profiles
* [ ] Optional PWA support
* [ ] More interactive AR objects

The roadmap is subject to change as the project evolves.

---

## 🧑‍💻 Development Philosophy

VAPOR.exe is built around three main ideas:

### 01 — Interaction First

The camera should feel like an input device rather than simply a background.

### 02 — Real-Time Visuals

Smoke and particles should respond dynamically to the user's actions.

### 03 — Personality Without Clutter

The interface should have a strong visual identity while keeping the actual interaction simple.

---

## ⭐ Project Status

**Status:** Experimental / Active Development

VAPOR.exe is currently a functional browser-based AR experiment with:

* Hand tracking
* Face tracking
* Interactive virtual cigarette
* Procedural smoke
* Smoke presets
* Wind controls
* Burn system
* Ash particles
* Responsive UI
* Game-style HUD
* Mobile layouts
* Adaptive performance modes
* Local camera processing
* Automated tests
* CI configuration

The project is still subject to browser, device, and camera-specific limitations.

---

## 🌐 Links

**Live Application**

`[YOUR_LIVE_URL_HERE]`

**GitHub Repository**

`[https://github.com/AboobakerSiddique/Vapor.exe]`


**Project / Portfolio**

`[https://portfolio-ten-theta-gasws6e4rg.vercel.app/]`

---

## 💜 VAPOR.exe

```text
┌──────────────────────────────────────┐
│                                      │
│              VAPOR.exe               │
│                                      │
│       SEE IT.  GRAB IT.  VAPE IT.    │
│                                      │
└──────────────────────────────────────┘
```

*A small experiment in browser-based AR, computer vision, and procedural graphics.*
