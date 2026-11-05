import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { ContactShadows, OrbitControls } from '@react-three/drei';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

/**
 * Procedural, photo-real-ish volleyballs. Textures are generated at runtime (no images, no logos):
 * - 'molten'  : indoor 18-panel ball, white / green / red curved panels, raised honeycomb micro-texture
 * - 'beachPro': beach 10-panel swirl ball, yellow / blue with white and red accents, dimpled surface
 */
export type BallDesign = 'molten' | 'beachPro';

type RGB = [number, number, number];
const hex = (h: string): RGB => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];

const MOLTEN = { white: hex('#F6F5F1'), green: hex('#0A8A47'), red: hex('#D81F2A'), seam: hex('#C9C9C2') };
const BEACH = { yellow: hex('#FFD31C'), blue: hex('#1E3FA8'), white: hex('#F8F8F5'), purple: hex('#7B3FB2'), red: hex('#E8383F'), orange: hex('#F7942A') };

/** Cube-face projection: local coords in [-1, 1], used for even micro-textures. */
function cubeFace(x: number, y: number, z: number) {
  const ax = Math.abs(x), ay = Math.abs(y), az = Math.abs(z);
  const c = [x, y, z];
  const i = ax >= ay && ax >= az ? 0 : ay >= az ? 1 : 2;
  const m = Math.max(ax, ay, az);
  return { along: c[(i + 1) % 3] / m, across: c[(i + 2) % 3] / m };
}

/** Honeycomb: distance to the hex cell edge (0 on the edge, ~1 in the center). */
function honeycomb(u: number, v: number, size: number) {
  const q = u / size, r = v / (size * 0.866);
  const row = Math.floor(r);
  const qq = q + (row % 2 ? 0.5 : 0);
  const dx = Math.abs(qq - Math.floor(qq) - 0.5), dy = Math.abs(r - row - 0.5) * 0.866;
  const d = Math.max(dx * 0.866 + dy * 0.5, dy);
  return Math.min(1, Math.max(0, (0.5 - d) * 7));
}

function dimples(u: number, v: number, size: number) {
  const fx = u / size - Math.floor(u / size) - 0.5, fy = v / size - Math.floor(v / size) - 0.5;
  return Math.min(1, Math.hypot(fx, fy) * 2.6);
}

const mix = (a: RGB, b: RGB, t: number): RGB => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const shade = (c: RGB, k: number): RGB => [c[0] * k, c[1] * k, c[2] * k];
const smooth = (e0: number, e1: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
};

/** Indoor ball: S-curved bands cycling white → red → green, printed honeycomb, thin seams. */
function moltenPixel(lat: number, lon: number, x: number, y: number, z: number): { c: RGB; b: number } {
  const W = 0.56;
  const f = lat + 0.62 * Math.sin(lon) + 0.14 * Math.sin(2 * lon);
  const n = Math.round(f / W);
  const fr = f / W - n; // −0.5 … 0.5 inside a band
  const cyc: RGB[] = [MOLTEN.white, MOLTEN.red, MOLTEN.green];
  let c = cyc[((n % 3) + 3) % 3];
  const fc = cubeFace(x, y, z);
  const hc = honeycomb(fc.along + 2, fc.across + 2, 0.085);
  // printed honeycomb is darker on the coloured panels, barely visible on white
  const isWhite = c === MOLTEN.white;
  c = shade(c, isWhite ? 0.97 + hc * 0.03 : 0.86 + hc * 0.14);
  const seam = 0.5 - Math.abs(fr) < 0.018;
  if (seam) return { c: MOLTEN.seam, b: 60 };
  return { c, b: 170 + hc * 70 };
}

/** Beach ball: blue · white · yellow · white · blue bands; blue fades through purple to red with halftone dots. */
function beachPixel(lat: number, lon: number, x: number, y: number, z: number): { c: RGB; b: number } {
  const W = 0.5;
  const f = lat + 0.3 * Math.sin(lon) + 0.06 * Math.sin(2 * lon);
  const n = Math.round(f / W);
  const fr = f / W - n;
  const an = Math.abs(n);
  let c: RGB = an === 0 ? BEACH.yellow : an === 1 ? BEACH.white : an === 2 ? BEACH.blue : BEACH.white;
  const fc = cubeFace(x, y, z);
  if (an === 2) {
    // warm gradient on one side of each blue band, printed as halftone dots
    const g = (Math.cos(2 * (lon - Math.PI) + (n > 0 ? 1.1 : -1.1)) + 1) / 2;
    const t = smooth(0.55, 1.0, g) * 0.92;
    const dot = dimples(fc.along + 2, fc.across + 2, 0.035);
    const warm = t < 0.5 ? mix(BEACH.purple, BEACH.red, t * 2) : mix(BEACH.red, BEACH.orange, (t - 0.5) * 2);
    if (dot < t * 0.95) c = warm;
  }
  const dp = dimples(fc.along + 7, fc.across + 7, 0.05);
  c = shade(c, 0.95 + dp * 0.05);
  const seam = 0.5 - Math.abs(fr) < 0.016;
  if (seam) return { c: shade(c, 0.7), b: 60 };
  return { c, b: 170 + dp * 70 };
}

function drawWordmark(ctx: CanvasRenderingContext2D, W: number, H: number, text: string, color: string, yOffset: number, size: number) {
  ctx.save();
  ctx.translate(W / 2, H / 2 + yOffset);
  ctx.transform(1, 0, -0.18, 1, 0, 0); // italic slant
  ctx.font = `900 ${size}px "Arial Black", "Helvetica Neue", Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  ctx.fillText(text, 0, 0);
  ctx.restore();
}

function makeTextures(design: BallDesign) {
  const W = 2048, H = 1024;
  const col = document.createElement('canvas');
  const bump = document.createElement('canvas');
  col.width = bump.width = W;
  col.height = bump.height = H;
  const cx = col.getContext('2d')!, bx = bump.getContext('2d')!;
  const ci = cx.createImageData(W, H), bi = bx.createImageData(W, H);
  for (let j = 0; j < H; j++) {
    const theta = ((j + 0.5) / H) * Math.PI;
    const st = Math.sin(theta), ct = Math.cos(theta);
    const lat = Math.PI / 2 - theta;
    for (let i = 0; i < W; i++) {
      const phi = ((i + 0.5) / W) * Math.PI * 2;
      const x = -Math.cos(phi) * st, y = ct, z = Math.sin(phi) * st; // THREE.SphereGeometry parametrisation
      const { c, b } = design === 'molten' ? moltenPixel(lat, phi, x, y, z) : beachPixel(lat, phi, x, y, z);
      const o = (j * W + i) * 4;
      ci.data[o] = c[0];
      ci.data[o + 1] = c[1];
      ci.data[o + 2] = c[2];
      ci.data[o + 3] = 255;
      bi.data[o] = bi.data[o + 1] = bi.data[o + 2] = b;
      bi.data[o + 3] = 255;
    }
  }
  cx.putImageData(ci, 0, 0);
  bx.putImageData(bi, 0, 0);
  // site wordmark on the main band (no third-party logos)
  if (design === 'molten') {
    drawWordmark(cx, W, H, 'VOLLEARN', '#141414', 0, 92);
  } else {
    drawWordmark(cx, W, H, 'VOLLEARN', '#141414', -H * 0.16, 74);
    drawWordmark(cx, W, H, 'BEACH', '#1E3FA8', 0, 92);
  }
  const map = new THREE.CanvasTexture(col);
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = 8;
  const bumpMap = new THREE.CanvasTexture(bump);
  bumpMap.anisotropy = 8;
  return { map, bumpMap };
}

/** Soft studio reflections without downloading an HDR file. */
function Studio() {
  const { gl, scene } = useThree();
  useEffect(() => {
    const pm = new THREE.PMREMGenerator(gl);
    const env = pm.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = env;
    return () => {
      scene.environment = null;
      env.dispose();
      pm.dispose();
    };
  }, [gl, scene]);
  return null;
}

function Ball({ design, spin }: { design: BallDesign; spin: boolean }) {
  const ref = useRef<THREE.Mesh>(null);
  const tex = useMemo(() => makeTextures(design), [design]);
  useEffect(() => () => { tex.map.dispose(); tex.bumpMap.dispose(); }, [tex]);
  useFrame(({ clock }) => {
    // gentle sway so the front (wordmark) stays in view; drag to look around
    if (spin && ref.current) ref.current.rotation.y = -Math.PI / 2 - 0.3 + Math.sin(clock.elapsedTime * 0.45) * 0.45;
  });
  return (
    <mesh ref={ref} rotation={[0.22, -Math.PI / 2 - 0.3, 0.12]}>
      <sphereGeometry args={[1, 128, 96]} />
      <meshPhysicalMaterial map={tex.map} bumpMap={tex.bumpMap} bumpScale={design === 'molten' ? 1.2 : 1.0}
        roughness={design === 'molten' ? 0.62 : 0.5} clearcoat={0.1} clearcoatRoughness={0.6} envMapIntensity={0.3} />
    </mesh>
  );
}

export default function Ball3D({ still = false, design = 'molten' }: { still?: boolean; design?: BallDesign }) {
  return (
    <Canvas camera={{ position: [0, 0.25, 3.3], fov: 40 }} dpr={[1, 2]} gl={{ antialias: true, alpha: true, toneMapping: THREE.NeutralToneMapping }}
      frameloop={still ? 'demand' : 'always'}>
      <Studio />
      <ambientLight intensity={0.25} />
      <directionalLight position={[3, 4, 5]} intensity={1.6} />
      <directionalLight position={[-4, -1, -2]} intensity={0.35} color="#bcd4ff" />
      <Ball design={design} spin={!still} />
      <ContactShadows position={[0, -1.2, 0]} opacity={0.4} scale={5} blur={2.4} far={2} />
      <OrbitControls enableZoom={false} enablePan={false} autoRotate={false} />
    </Canvas>
  );
}
