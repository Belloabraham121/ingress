import * as THREE from "three";
import { periodicNoiseGLSL } from "./utils";

// Function to generate equally distributed points on a plane
function getPlane(
  count: number,
  components: number,
  size: number = 512,
  scale: number = 1.0
) {
  const length = count * components;
  const data = new Float32Array(length);

  for (let i = 0; i < count; i++) {
    const i4 = i * components;

    // Calculate grid position
    const x = (i % size) / (size - 1); // Normalize to [0, 1]
    const z = Math.floor(i / size) / (size - 1); // Normalize to [0, 1]

    // Convert to centered coordinates [-0.5, 0.5] and apply scale
    data[i4 + 0] = (x - 0.5) * 2 * scale; // X position: scaled range
    data[i4 + 1] = 0; // Y position: flat plane at y=0
    data[i4 + 2] = (z - 0.5) * 2 * scale; // Z position: scaled range
    data[i4 + 3] = 1.0; // W component (for RGBA texture)
  }

  return data;
}

export class SimulationMaterial extends THREE.ShaderMaterial {
  constructor(scale: number = 10.0) {
    const positionsTexture = new THREE.DataTexture(
      getPlane(512 * 512, 4, 512, scale),
      512,
      512,
      THREE.RGBAFormat,
      THREE.FloatType
    );
    positionsTexture.needsUpdate = true;

    super({
      vertexShader: /* glsl */ `varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
      fragmentShader: /* glsl */ `uniform sampler2D positions;
      uniform float uTime;
      uniform float uNoiseScale;       // Reused as spatial frequency controller
      uniform float uNoiseIntensity;   // Reused as displacement amplitude
      uniform float uTimeScale;
      uniform float uLoopPeriod;
      varying vec2 vUv;

      // We keep periodic noise utils imported to avoid changing imports.
      ${periodicNoiseGLSL}

      // Helper to create smoothly varying phase to avoid strobing
      float loopTime(float t, float period) {
        return t * (6.28318530718 / period);
      }

      void main() {
        // Base lattice position from texture
        vec3 originalPos = texture2D(positions, vUv).rgb;

        // Time that loops perfectly over uLoopPeriod
        float t = loopTime(uTime * uTimeScale, uLoopPeriod);

        // Water-like motion using two Gerstner-style waves
        // Map uNoiseScale to spatial frequency, and uNoiseIntensity to amplitude
        float frequency = max(0.5, uNoiseScale) * 1.6;
        float amplitude = uNoiseIntensity;   // overall amplitude
        float steepness = 0.6;               // controls horizontal displacement

        // Two primary wave directions (XZ plane)
        vec2 d1 = normalize(vec2(1.0, 0.25));
        vec2 d2 = normalize(vec2(-0.35, 1.0));

        // Angular frequency; tune to keep nice loop with uLoopPeriod
        float k = frequency * 2.0;           // wave number
        float w1 = 0.9;                      // relative speed
        float w2 = 1.15;

        // Phases
        float phase1 = dot(originalPos.xz, d1) * k - t * w1 * 2.0;
        float phase2 = dot(originalPos.xz, d2) * k - t * w2 * 2.0;

        // Vertical displacement (crest/trough)
        float dispY = sin(phase1) + 0.8 * sin(phase2);

        // Horizontal (tangential) drift to emulate water advection
        vec2 horiz1 = d1 * cos(phase1);
        vec2 horiz2 = d2 * cos(phase2);
        vec2 dispXZ = steepness * (horiz1 + 0.8 * horiz2);

        // Small shimmering using periodic noise to break uniformity
        float shimmer = periodicNoise(originalPos * 1.5, t * 0.2) * 0.15;

        vec3 distortion = vec3(dispXZ.x, dispY, dispXZ.y) * amplitude;
        distortion.y += shimmer;

        vec3 finalPos = originalPos + distortion;

        gl_FragColor = vec4(finalPos, 1.0);
      }`,
      uniforms: {
        positions: { value: positionsTexture },
        uTime: { value: 0 },
        uNoiseScale: { value: 1.0 },
        uNoiseIntensity: { value: 0.5 },
        uTimeScale: { value: 1 },
        uLoopPeriod: { value: 24.0 },
      },
    });
  }
}
