import * as THREE from "three";
import {
  ASH_SPAWN_RATE,
  MAX_PARTICLES,
  PIXEL_RATIO_CAP,
  QUALITY_DROP_FPS,
  QUALITY_DROP_SECONDS,
  QUALITY_RECOVER_FPS,
  QUALITY_RECOVER_SECONDS,
  SMOKE_VOLUME_MULTIPLIER,
} from "./config";
import { REALISTIC_PRESET, type SmokePreset } from "./smoke-presets";
import { useInteractionStore } from "./store";
import type { FaceAnalysis, InteractionSnapshot, Point3, SmokeEmission } from "./types";

const vertexShader = `
  uniform float uTime;
  uniform float uPixelRatio;
  uniform float uTurbulenceScale;
  uniform vec2 uWindDirection;
  uniform float uWindStrength;
  attribute vec3 aStart;
  attribute vec3 aVelocity;
  attribute float aSpawnTime;
  attribute float aLifetime;
  attribute float aSize;
  attribute float aSeed;
  attribute float aKind;
  varying float vAlpha;
  varying float vKind;
  varying float vSeed;
  varying vec2 vScreenPos;
  varying float vLifeT;

  void main() {
    float age = uTime - aSpawnTime;
    float lifeT = clamp(age / max(aLifetime, 0.01), 0.0, 1.0);
    float alive = step(0.0, age) * (1.0 - step(aLifetime, age));
    // aKind: 0 = ember/tip smoke, 1 = mouth burst, 2 = nose burst, 3 = falling ash.
    float isAsh = step(2.5, aKind);
    float isSmoke = 1.0 - isAsh;
    float curl = sin(age * (1.5 + aSeed * 1.8) + aSeed * 12.0) * uTurbulenceScale;
    float crossCurl = cos(age * (1.1 + aSeed) + aSeed * 7.0) * uTurbulenceScale;
    float mouthSmoke = step(0.5, aKind);
    float exhaleSmoke = step(1.5, aKind);
    vec3 position = aStart + aVelocity * age;
    // Wind and the smoke curl/rise formulas only apply to smoke kinds (0-2) —
    // isSmoke zeroes them out for ash so ash doesn't rise or catch the wind
    // the way rising smoke does.
    position.x += uWindDirection.x * uWindStrength * age * isSmoke;
    position.y += uWindDirection.y * uWindStrength * age * isSmoke;
    position.x += curl * age * age * (mix(0.004, 0.011, mouthSmoke) + exhaleSmoke * 0.004) * isSmoke;
    position.y += crossCurl * age * mix(0.003, 0.007, mouthSmoke) * isSmoke;
    position.y -= age * age * (mix(0.005, 0.011, mouthSmoke) + exhaleSmoke * 0.003) * isSmoke;
    // Ash falls under light gravity and tumbles slightly sideways, instead of
    // rising like smoke.
    position.x += curl * age * 0.006 * isAsh;
    position.y += age * age * 0.05 * isAsh;

    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    float ashShrink = mix(1.0, 0.4, lifeT) * isAsh + isSmoke;
    gl_PointSize = aSize * uPixelRatio * mix(0.72, 3.45, smoothstep(0.0, 0.78, lifeT)) * ashShrink;
    gl_PointSize *= alive;
    vAlpha = alive * smoothstep(0.0, 0.05, lifeT) * (1.0 - smoothstep(0.48, 1.0, lifeT));
    vKind = aKind;
    vSeed = aSeed;
    vScreenPos = position.xy;
    vLifeT = lifeT;
  }
`;

const fragmentShader = `
  precision highp float;
  uniform vec3 uColor;
  uniform float uTipOpacity;
  uniform float uBurstOpacity;
  uniform float uNoseOpacityBonus;
  uniform vec3 uAshColor;
  uniform float uAshOpacity;
  uniform float uIntensity;
  uniform vec2 uOccluderCenter;
  uniform float uOccluderRadius;
  uniform float uOccluderStrength;
  varying float vAlpha;
  varying float vKind;
  varying float vSeed;
  varying vec2 vScreenPos;
  varying float vLifeT;

  float hash(vec2 point) {
    return fract(sin(dot(point, vec2(127.1, 311.7))) * 43758.5453123);
  }

  float noise(vec2 point) {
    vec2 cell = floor(point);
    vec2 local = fract(point);
    local = local * local * (3.0 - 2.0 * local);
    return mix(
      mix(hash(cell), hash(cell + vec2(1.0, 0.0)), local.x),
      mix(hash(cell + vec2(0.0, 1.0)), hash(cell + vec2(1.0, 1.0)), local.x),
      local.y
    );
  }

  float fbm(vec2 point) {
    float value = 0.0;
    float amplitude = 0.5;
    mat2 rotation = mat2(0.82, 0.57, -0.57, 0.82);
    for (int octave = 0; octave < 3; octave++) {
      value += amplitude * noise(point);
      point = rotation * point * 2.03 + 7.17;
      amplitude *= 0.5;
    }
    return value;
  }

  void main() {
    vec2 point = gl_PointCoord * 2.0 - 1.0;
    float angle = vSeed * 6.2831853;
    mat2 rotation = mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
    point = rotation * point;
    point.x *= mix(0.72, 1.34, hash(vec2(vSeed, 3.7)));
    float radius = length(point);
    float broadNoise = fbm(point * 2.4 + vec2(vSeed * 13.7, vSeed * -9.3));
    float fineNoise = fbm(point * 5.8 + vec2(vSeed * -17.1, vSeed * 8.9));
    float brokenEdge = radius + (broadNoise - 0.5) * 0.48 + (fineNoise - 0.5) * 0.14;
    float envelope = 1.0 - smoothstep(0.32, 1.03, brokenEdge);
    float wisps = mix(0.48, 1.0, smoothstep(0.25, 0.88, broadNoise * 0.72 + fineNoise * 0.28));
    float mouthSmoke = step(0.5, vKind);
    float exhaleSmoke = step(1.5, vKind);
    float smokeOpacity = mix(uTipOpacity, uBurstOpacity, mouthSmoke) + exhaleSmoke * uNoseOpacityBonus;
    float smokeAlpha = vAlpha * envelope * wisps * smokeOpacity;

    // Volumetric-style self-shading: reuse the same noise that shapes the
    // silhouette to vary color across the sprite, so denser-looking regions
    // read slightly darker and thin wisps read slightly lighter, instead of
    // every pixel of every particle being one flat color.
    float density = clamp(broadNoise * 0.6 + fineNoise * 0.4, 0.0, 1.0);
    vec3 smokeColor = uColor * mix(1.15, 0.82, density);

    // Hand-region occlusion: while the cigarette is actively held, its mapped
    // position approximates where the hand is (see smoke-renderer.ts
    // update()). Smoke that has aged past a threshold — i.e. has drifted away
    // from the ember rather than just spawning at it — gets dimmed if it
    // falls within that region, so smoke reads as passing behind the hand
    // instead of always drawing on top of it. Freshly-spawned particles are
    // exempt so tip smoke doesn't vanish the instant it appears next to the
    // hand holding the cigarette.
    float distToOccluder = length(vScreenPos - uOccluderCenter);
    float occluderRegion = 1.0 - smoothstep(uOccluderRadius * 0.7, uOccluderRadius, distToOccluder);
    float ageEligible = smoothstep(0.25, 0.45, vLifeT);
    float occlusion = occluderRegion * ageEligible * uOccluderStrength;
    smokeAlpha *= (1.0 - occlusion * 0.85);

    // Ash (vKind 3) renders as a small, mostly-solid disc rather than a wispy
    // smoke cloud, and ignores the broken-edge noise envelope used above.
    float isAsh = step(2.5, vKind);
    float ashEnvelope = 1.0 - smoothstep(0.55, 1.0, radius);
    float ashAlpha = vAlpha * ashEnvelope * uAshOpacity * (1.0 - occlusion * 0.85);

    float alpha = mix(smokeAlpha, ashAlpha, isAsh) * uIntensity;
    vec3 color = mix(smokeColor, uAshColor, isAsh);
    if (alpha < 0.0015) discard;
    gl_FragColor = vec4(color, alpha);
  }
`;

export type Quality = "HIGH" | "MEDIUM" | "LOW";

export interface RendererDiagnostics {
  webglVersion: "WEBGL2" | "WEBGL1";
  renderer: string;
  vendor: string;
  hardwareAccelerated: boolean;
  maxTextureSize: number;
}

export class SmokeRenderer {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.OrthographicCamera(0, 1, 0, 1, 0.1, 10);
  private cigarette = new THREE.Group();
  private ember = new THREE.Mesh<THREE.CircleGeometry, THREE.MeshBasicMaterial>();
  private glow = new THREE.Mesh<THREE.CircleGeometry, THREE.MeshBasicMaterial>();
  private lipMask: THREE.Mesh<THREE.CircleGeometry, THREE.MeshBasicMaterial>;
  private particleGeometry = new THREE.BufferGeometry();
  private particleMaterial: THREE.ShaderMaterial;
  private points: THREE.Points;
  private starts = new Float32Array(MAX_PARTICLES * 3);
  private velocities = new Float32Array(MAX_PARTICLES * 3);
  private spawnTimes = new Float32Array(MAX_PARTICLES);
  private lifetimes = new Float32Array(MAX_PARTICLES);
  private sizes = new Float32Array(MAX_PARTICLES);
  private seeds = new Float32Array(MAX_PARTICLES);
  private kinds = new Float32Array(MAX_PARTICLES);
  private cursor = 0;
  private width = 1;
  private height = 1;
  private videoWidth = 1920;
  private videoHeight = 1080;
  private displayedWidth = 1;
  private displayedHeight = 1;
  private cropX = 0;
  private cropY = 0;
  private baseSmokeAccumulator = 0;
  private ashAccumulator = 0;
  private windDirection: Point3 = { x: 0, y: 0, z: 0 };
  private windStrength = 0;
  private intensity = 1;
  private quality: Quality = "HIGH";
  private lowFpsDuration = 0;
  private recoveryDuration = 0;
  private mouthParticleCount = 0;
  private baseSmokeParticleCount = 0;
  private lastParticleDebugUpdate = 0;
  private preset: SmokePreset;

  constructor(canvas: HTMLCanvasElement, preset: SmokePreset = REALISTIC_PRESET) {
    this.preset = preset;
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: false,
      powerPreference: "high-performance",
      precision: "highp",
      premultipliedAlpha: false,
    });
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, PIXEL_RATIO_CAP));
    this.camera.position.set(0, 0, 2);
    this.camera.lookAt(0, 0, 0);
    this.camera.updateProjectionMatrix();

    this.createCigarette();
    // The screen-space camera intentionally uses Y-down coordinates to match
    // MediaPipe and the mirrored video. That flips triangle winding, so these
    // thin 2.5D planes must render from both sides.
    this.cigarette.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      for (const material of materials) {
        material.side = THREE.DoubleSide;
        material.needsUpdate = true;
      }
    });
    this.cigarette.frustumCulled = false;
    this.scene.add(this.cigarette);

    this.lipMask = new THREE.Mesh(
      new THREE.CircleGeometry(0.5, 28),
      new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: true, depthTest: true, side: THREE.DoubleSide }),
    );
    this.lipMask.position.z = 0.22;
    this.lipMask.renderOrder = 1;
    this.lipMask.visible = false;
    this.scene.add(this.lipMask);

    // Three.js uses the conventional position attribute to determine how many
    // points to draw, even when a custom shader reads positions from aStart.
    // Without it, drawCount stays Infinity and WebGLRenderer skips the draw.
    this.particleGeometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(MAX_PARTICLES * 3), 3));
    this.particleGeometry.setDrawRange(0, MAX_PARTICLES);
    this.particleGeometry.setAttribute("aStart", new THREE.BufferAttribute(this.starts, 3));
    this.particleGeometry.setAttribute("aVelocity", new THREE.BufferAttribute(this.velocities, 3));
    this.particleGeometry.setAttribute("aSpawnTime", new THREE.BufferAttribute(this.spawnTimes, 1));
    this.particleGeometry.setAttribute("aLifetime", new THREE.BufferAttribute(this.lifetimes, 1));
    this.particleGeometry.setAttribute("aSize", new THREE.BufferAttribute(this.sizes, 1));
    this.particleGeometry.setAttribute("aSeed", new THREE.BufferAttribute(this.seeds, 1));
    this.particleGeometry.setAttribute("aKind", new THREE.BufferAttribute(this.kinds, 1));

    this.particleMaterial = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uPixelRatio: { value: this.renderer.getPixelRatio() },
        uColor: { value: new THREE.Color(...this.preset.color) },
        uTipOpacity: { value: this.preset.tipOpacity },
        uBurstOpacity: { value: this.preset.burstOpacity },
        uNoseOpacityBonus: { value: this.preset.noseOpacityBonus },
        uAshColor: { value: new THREE.Color(...this.preset.ashColor) },
        uAshOpacity: { value: this.preset.ashOpacity },
        uIntensity: { value: this.intensity },
        uOccluderCenter: { value: new THREE.Vector2(0.5, 0.7) },
        uOccluderRadius: { value: 0.05 },
        uOccluderStrength: { value: 0 },
        uTurbulenceScale: { value: this.preset.turbulenceScale },
        uWindDirection: { value: new THREE.Vector2(this.windDirection.x, this.windDirection.y) },
        uWindStrength: { value: this.windStrength },
      },
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: this.preset.blending === "additive" ? THREE.AdditiveBlending : THREE.NormalBlending,
    });
    this.points = new THREE.Points(this.particleGeometry, this.particleMaterial);
    this.points.position.z = 0.32;
    this.points.frustumCulled = false;
    this.points.renderOrder = 2;
    this.scene.add(this.points);
    this.resize(window.innerWidth, window.innerHeight, this.videoWidth, this.videoHeight);
  }

  private createCigarette() {
    const outline = new THREE.Mesh(
      new THREE.PlaneGeometry(1.055, 0.135),
      new THREE.MeshBasicMaterial({ color: 0x151515, transparent: true, opacity: 0.68 }),
    );
    outline.position.z = -0.02;
    this.cigarette.add(outline);

    const shadow = new THREE.Mesh(
      new THREE.PlaneGeometry(1.02, 0.11),
      new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.38 }),
    );
    shadow.position.set(0.012, 0.028, -0.03);
    this.cigarette.add(shadow);

    const ash = new THREE.Mesh(
      new THREE.PlaneGeometry(0.075, 0.095),
      new THREE.MeshBasicMaterial({ color: 0x77736b }),
    );
    ash.position.x = -0.4625;
    this.cigarette.add(ash);

    const paper = new THREE.Mesh(
      new THREE.PlaneGeometry(0.67, 0.095),
      new THREE.MeshBasicMaterial({ color: 0xfffcf2 }),
    );
    paper.position.x = -0.09;
    this.cigarette.add(paper);

    const paperShade = new THREE.Mesh(
      new THREE.PlaneGeometry(0.67, 0.025),
      new THREE.MeshBasicMaterial({ color: 0xb9b5ad, transparent: true, opacity: 0.55 }),
    );
    paperShade.position.set(-0.09, 0.035, 0.006);
    this.cigarette.add(paperShade);

    const filter = new THREE.Mesh(
      new THREE.PlaneGeometry(0.255, 0.1),
      new THREE.MeshBasicMaterial({ color: 0xb9783d }),
    );
    filter.position.x = 0.3725;
    this.cigarette.add(filter);

    const filterBand = new THREE.Mesh(
      new THREE.PlaneGeometry(0.018, 0.102),
      new THREE.MeshBasicMaterial({ color: 0xc59a64 }),
    );
    filterBand.position.set(0.252, 0, 0.008);
    this.cigarette.add(filterBand);

    this.ember = new THREE.Mesh(
      new THREE.CircleGeometry(0.057, 18),
      new THREE.MeshBasicMaterial({ color: 0xf24a1d }),
    );
    this.ember.position.set(-0.502, 0, 0.025);
    this.cigarette.add(this.ember);

    this.glow = new THREE.Mesh(
      new THREE.CircleGeometry(0.11, 24),
      new THREE.MeshBasicMaterial({ color: 0xff4a16, transparent: true, opacity: 0.28, blending: THREE.AdditiveBlending, depthWrite: false }),
    );
    this.glow.position.set(-0.505, 0, 0.015);
    this.cigarette.add(this.glow);
    this.cigarette.position.z = 0.08;
    this.cigarette.renderOrder = 0;
  }

  /** Current adaptive particle-quality tier, computed from measured FPS. */
  getQuality(): Quality {
    return this.quality;
  }

  getDiagnostics(): RendererDiagnostics {
    const gl = this.renderer.getContext();
    const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
    const renderer = String(
      debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER),
    );
    const vendor = String(
      debugInfo ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : gl.getParameter(gl.VENDOR),
    );
    return {
      webglVersion: this.renderer.capabilities.isWebGL2 ? "WEBGL2" : "WEBGL1",
      renderer,
      vendor,
      hardwareAccelerated: !/(swiftshader|llvmpipe|software rasterizer)/i.test(renderer),
      maxTextureSize: this.renderer.capabilities.maxTextureSize,
    };
  }

  resize(width: number, height: number, videoWidth = this.videoWidth, videoHeight = this.videoHeight) {
    this.width = Math.max(1, width);
    this.height = Math.max(1, height);
    this.videoWidth = Math.max(1, videoWidth);
    this.videoHeight = Math.max(1, videoHeight);
    this.renderer.setSize(this.width, this.height, false);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, PIXEL_RATIO_CAP));
    if (this.particleMaterial?.uniforms.uPixelRatio) {
      this.particleMaterial.uniforms.uPixelRatio.value = this.renderer.getPixelRatio();
    }

    const videoAspect = this.videoWidth / this.videoHeight;
    const viewportAspect = this.width / this.height;
    if (viewportAspect > videoAspect) {
      this.displayedWidth = this.width;
      this.displayedHeight = this.width / videoAspect;
      this.cropX = 0;
      this.cropY = (this.displayedHeight - this.height) * 0.5;
    } else {
      this.displayedHeight = this.height;
      this.displayedWidth = this.height * videoAspect;
      this.cropX = (this.displayedWidth - this.width) * 0.5;
      this.cropY = 0;
    }
  }

  update(snapshot: InteractionSnapshot, face: FaceAnalysis, now: number, dt: number, fps: number) {
    const time = now / 1000;
    this.particleMaterial.uniforms.uTime.value = time;
    this.updatePerformanceQuality(fps, dt);

    const mapped = this.mapPoint(snapshot.cigarettePosition);
    const mappedLength = this.mapLength(snapshot.cigaretteLength);
    const mappedBaseLength = this.mapLength(snapshot.cigaretteBaseLength);
    this.cigarette.position.x = mapped.x;
    this.cigarette.position.y = mapped.y;
    this.cigarette.rotation.z = snapshot.cigaretteRotation;
    // Geometry is already modeled at roughly a 10:1 cigarette aspect ratio.
    // Only convert normalized X units to normalized Y units here; applying 0.1
    // again made the cigarette just 2–3 physical pixels thick.
    this.cigarette.scale.set(mappedLength, mappedBaseLength * (this.width / this.height) * 1.15, 1);
    const burning = snapshot.smokingState === "INHALING";

    // Hand-region occlusion (see fragment shader): approximate "where the
    // hand is" as the cigarette's mapped position while a hand is actively
    // holding it. IDLE/FALLING have no hand nearby, so strength is 0 and the
    // occlusion term in the shader has no effect.
    const held = snapshot.cigaretteState !== "IDLE" && snapshot.cigaretteState !== "FALLING";
    this.particleMaterial.uniforms.uOccluderCenter.value.set(mapped.x, mapped.y);
    this.particleMaterial.uniforms.uOccluderRadius.value = Math.max(0.03, mappedBaseLength * 1.8);
    this.particleMaterial.uniforms.uOccluderStrength.value = held ? 1 : 0;

    const flicker = 0.9 + Math.sin(now * 0.013) * 0.08 + Math.sin(now * 0.037) * 0.035;
    this.ember.scale.setScalar(flicker);
    this.ember.material.color.setHex(burning ? 0xff4b1f : 0x665f59);
    this.glow.scale.setScalar(0.92 + Math.sin(now * 0.009) * 0.08);
    this.glow.material.opacity = burning ? 0.34 : 0.025;

    const mouthAttached = snapshot.cigaretteMouthSide !== null && (face.visible || face.inGracePeriod);
    this.lipMask.visible = mouthAttached;
    if (mouthAttached) {
      const mouth = this.mapPoint(face.mouthCenter);
      this.lipMask.position.x = mouth.x;
      this.lipMask.position.y = mouth.y;
      this.lipMask.rotation.z = face.roll;
      this.lipMask.scale.set(this.mapLength(face.mouthWidth) * 0.52, this.mapLength(face.mouthWidth) * 0.15 * (this.width / this.height), 1);
    }

    const emberVideo: Point3 = {
      x: snapshot.cigarettePosition.x - Math.cos(snapshot.cigaretteRotation) * snapshot.cigaretteLength * 0.505,
      y: snapshot.cigarettePosition.y - Math.sin(snapshot.cigaretteRotation) * snapshot.cigaretteLength * 0.505,
      z: 0,
    };
    const emberOrigin = this.mapPoint(emberVideo);
    this.baseSmokeAccumulator = burning ? this.baseSmokeAccumulator + dt * 60 * this.qualityFactor() : 0;
    let spawnedTipSmoke = false;
    while (this.baseSmokeAccumulator >= 1) {
      this.baseSmokeAccumulator -= 1;
      this.baseSmokeParticleCount += 1;
      this.spawn(emberOrigin, { x: (Math.random() - 0.5) * 0.016, y: -0.016 - Math.random() * 0.018, z: 0 }, 0, 4 + Math.random() * 2, 18 + Math.random() * 15);
      spawnedTipSmoke = true;
    }
    if (spawnedTipSmoke) this.markParticlesDirty();

    // Ash flecks fall from the ember at a much lower rate than tip smoke is
    // emitted, and use their own accumulator/spawn kind (see setPreset/vertex
    // shader) so they can fall + shrink instead of rising like smoke.
    this.ashAccumulator = burning ? this.ashAccumulator + dt * ASH_SPAWN_RATE * this.qualityFactor() : 0;
    let spawnedAsh = false;
    while (this.ashAccumulator >= 1) {
      this.ashAccumulator -= 1;
      this.spawn(
        emberOrigin,
        { x: (Math.random() - 0.5) * 0.01, y: 0.002 + Math.random() * 0.006, z: 0 },
        3,
        1.2 + Math.random() * 0.8,
        4 + Math.random() * 3,
      );
      spawnedAsh = true;
    }
    if (spawnedAsh) this.markParticlesDirty();

    this.renderer.render(this.scene, this.camera);
    if (useInteractionStore.getState().debugMode && now - this.lastParticleDebugUpdate >= 250) {
      this.lastParticleDebugUpdate = now;
      useInteractionStore.getState().updateRuntime({
        baseSmokeParticles: this.baseSmokeParticleCount,
        particleDrawCount: this.renderer.info.render.points,
      });
    }
  }

  /** Swap the active smoke preset's color/opacity/turbulence/blend-mode uniforms without rebuilding the renderer. */
  setPreset(preset: SmokePreset) {
    this.preset = preset;
    this.particleMaterial.uniforms.uColor.value.setRGB(...preset.color);
    this.particleMaterial.uniforms.uTipOpacity.value = preset.tipOpacity;
    this.particleMaterial.uniforms.uBurstOpacity.value = preset.burstOpacity;
    this.particleMaterial.uniforms.uNoseOpacityBonus.value = preset.noseOpacityBonus;
    this.particleMaterial.uniforms.uAshColor.value.setRGB(...preset.ashColor);
    this.particleMaterial.uniforms.uAshOpacity.value = preset.ashOpacity;
    this.particleMaterial.uniforms.uTurbulenceScale.value = preset.turbulenceScale;
    this.particleMaterial.blending = preset.blending === "additive" ? THREE.AdditiveBlending : THREE.NormalBlending;
  }

  /** Set an ambient wind direction (normalized screen-space x/y) and strength (0 = none). */
  setWind(directionX: number, directionY: number, strength: number) {
    this.windDirection = { x: directionX, y: directionY, z: 0 };
    this.windStrength = strength;
    this.particleMaterial.uniforms.uWindDirection.value.set(directionX, directionY);
    this.particleMaterial.uniforms.uWindStrength.value = strength;
  }

  /** Overall smoke opacity multiplier, independent of the active preset. 1 = preset default. */
  setIntensity(value: number) {
    this.intensity = value;
    this.particleMaterial.uniforms.uIntensity.value = value;
  }

  emit(emission: SmokeEmission) {
    if (emission.type === "MOUTH_BURST") this.emitMouthBurst(emission);
    if (emission.type === "NOSE_BURST") this.emitNoseBurst(emission);
  }

  private emitMouthBurst(emission: Extract<SmokeEmission, { type: "MOUTH_BURST" }>) {
    const factor = this.qualityFactor();
    const origin = this.mapPoint(emission.origin);
    const count = Math.max(
      600,
      Math.round((280 + emission.strength * 120) * SMOKE_VOLUME_MULTIPLIER * factor),
    );
    this.mouthParticleCount += count;
    for (let index = 0; index < count; index += 1) {
      const lateral = (Math.random() + Math.random() - 1) * (0.075 + emission.strength * 0.035);
      const upward = -(0.075 + Math.pow(Math.random(), 0.68) * (0.14 + emission.strength * 0.045));
      const layeredOrigin = {
        x: origin.x + (Math.random() - 0.5) * 0.022,
        y: origin.y + (Math.random() - 0.5) * 0.012,
        z: origin.z,
      };
      this.spawn(
        layeredOrigin,
        { x: emission.direction.x * 0.08 + lateral, y: upward, z: 0 },
        1,
        2.7 + Math.random() * 1.5,
        20 + Math.random() * 42,
      );
    }
    this.markParticlesDirty();
  }

  private emitNoseBurst(emission: Extract<SmokeEmission, { type: "NOSE_BURST" }>) {
    const factor = this.qualityFactor();
    const origins = [this.mapPoint(emission.origin), this.mapPoint(emission.secondaryOrigin)];
    const countPerNostril = Math.max(
      200,
      Math.round((70 + emission.strength * 24) * SMOKE_VOLUME_MULTIPLIER * factor),
    );
    this.mouthParticleCount += countPerNostril * 2;
    origins.forEach((origin, nostrilIndex) => {
      const outward = nostrilIndex === 0 ? -1 : 1;
      for (let index = 0; index < countPerNostril; index += 1) {
        this.spawn(
          origin,
          {
            x: outward * (0.012 + Math.random() * 0.024) + (Math.random() - 0.5) * 0.014,
            y: -(0.065 + Math.random() * 0.105),
            z: 0,
          },
          2,
          2.3 + Math.random() * 1.2,
          14 + Math.random() * 25,
        );
      }
    });
    this.markParticlesDirty();
  }

  private spawn(origin: Point3, velocity: Point3, kind: number, lifetime: number, size: number) {
    const index = this.cursor;
    this.cursor = (this.cursor + 1) % MAX_PARTICLES;
    const base = index * 3;
    const originJitter = kind >= 1 ? 0.01 : 0.004;
    this.starts[base] = origin.x + (Math.random() - 0.5) * originJitter;
    this.starts[base + 1] = origin.y + (Math.random() - 0.5) * originJitter;
    this.starts[base + 2] = 0.3;
    this.velocities[base] = velocity.x;
    this.velocities[base + 1] = velocity.y;
    this.velocities[base + 2] = 0;
    this.spawnTimes[index] = this.particleMaterial.uniforms.uTime.value;
    this.lifetimes[index] = lifetime;
    this.sizes[index] = size;
    this.seeds[index] = Math.random();
    this.kinds[index] = kind;
  }

  private markParticlesDirty() {
    for (const name of ["aStart", "aVelocity", "aSpawnTime", "aLifetime", "aSize", "aSeed", "aKind"]) {
      (this.particleGeometry.getAttribute(name) as THREE.BufferAttribute).needsUpdate = true;
    }
  }

  private mapPoint(point: Point3): Point3 {
    return {
      x: (point.x * this.displayedWidth - this.cropX) / this.width,
      y: (point.y * this.displayedHeight - this.cropY) / this.height,
      z: point.z,
    };
  }

  private mapLength(length: number) {
    return length * this.displayedWidth / this.width;
  }

  private qualityFactor() {
    return this.quality === "HIGH" ? 1 : this.quality === "MEDIUM" ? 0.72 : 0.48;
  }

  private updatePerformanceQuality(fps: number, dt: number) {
    if (!fps) return;
    if (fps < QUALITY_DROP_FPS) {
      this.lowFpsDuration += dt;
      this.recoveryDuration = 0;
    } else if (fps > QUALITY_RECOVER_FPS) {
      this.recoveryDuration += dt;
      this.lowFpsDuration = Math.max(0, this.lowFpsDuration - dt * 0.5);
    }

    let next = this.quality;
    if (this.lowFpsDuration > QUALITY_DROP_SECONDS) {
      next = this.quality === "HIGH" ? "MEDIUM" : "LOW";
      this.lowFpsDuration = 0;
    } else if (this.recoveryDuration > QUALITY_RECOVER_SECONDS) {
      next = this.quality === "LOW" ? "MEDIUM" : "HIGH";
      this.recoveryDuration = 0;
    }
    if (next !== this.quality) {
      this.quality = next;
      if (useInteractionStore.getState().debugMode) {
        useInteractionStore.getState().updateRuntime({ particleQuality: next });
      }
    }
  }

  dispose() {
    this.renderer.dispose();
    this.particleGeometry.dispose();
    this.particleMaterial.dispose();
    this.scene.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      object.geometry.dispose();
      if (Array.isArray(object.material)) object.material.forEach((material) => material.dispose());
      else object.material.dispose();
    });
  }
}
