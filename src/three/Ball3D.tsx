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

const MOLTEN = { white: hex('#F4F3EE'), green: hex('#0B8F4D'), red: hex('#D3202C'), seam: hex('#9A9A94') };
const BEACH = { yellow: hex('#FFCF1A'), blue: hex('#1B4FAE'), white: hex('#F7F7F2'), red: hex('#D8262F'), seam: hex('#2A2A2A') };

/** Cube-face projection: returns face axis, sign and local coords in [-1, 1]. */
function cubeFace(x: number, y: number, z: number) {
  const ax = Math.abs(x), ay = Math.abs(y), az = Math.abs(z);
  const c = [x, y, z];
  const i = ax >= ay && ax >= az ? 0 : ay >= az ? 1 : 2;
  const m = Math.max(ax, ay, az);
  // strips run along axis (i+1)%3 and are divided along (i+2)%3 → neighbouring faces are perpendicular
  const along = c[(i + 1) % 3] / m;
  const across = c[(i + 2) % 3] / m;
  return { i, s: Math.sign(c[i]), along, across };
}

/** Raised honeycomb: 0 at cell edges, 1 in cell centers. */
function honeycomb(u: number, v: number, size: number) {
  const q = u / size, r = v / (size * 0.866);
  const row = Math.floor(r);
  const qq = q + (row % 2 ? 0.5 : 0);
  const cx = Math.floor(qq) + 0.5, cy = row + 0.5;
  const dx = Math.abs(qq - cx), dy = Math.abs(r - cy) * 0.866;
  const d = Math.max(dx * 0.866 + dy * 0.5, dy);
  return Math.min(1, Math.max(0, (0.5 - d) * 6));
}

function dimples(u: number, v: number, size: number) {
  const fx = (u / size) % 1, fy = (v / size) % 1;
  const dx = (fx < 0 ? fx + 1 : fx) - 0.5, dy = (fy < 0 ? fy + 1 : fy) - 0.5;
  return Math.min(1, Math.hypot(dx, dy) * 2.6);
}

function shade(c: RGB, k: number): RGB {
  return [c[0] * k, c[1] * k, c[2] * k];
}

function moltenPixel(x: number, y: number, z: number): { c: RGB; b: number } {
  const f = cubeFace(x, y, z);
  // gentle S-curve on the strip borders, like the real curved panels
  const bend = 0.16 * Math.sin(f.along * Math.PI * 0.95) * f.s;
  const a = f.across + bend;
  const strip = a < -1 / 3 ? 0 : a < 1 / 3 ? 1 : 2;
  const edge = Math.min(Math.abs(a + 1 / 3), Math.abs(a - 1 / 3));
  const faceEdge = 1 - Math.max(Math.abs(f.along), Math.abs(f.across));
  // tri-colour: each face carries green · white · red, mirrored on the opposite face
  const order: RGB[] = f.s > 0 ? [MOLTEN.green, MOLTEN.white, MOLTEN.red] : [MOLTEN.red, MOLTEN.white, MOLTEN.green];
  let c = order[strip];
  // thin accent piping inside the white strip
  if (strip === 1 && edge > 0.025 && edge < 0.05) c = f.i === 1 ? MOLTEN.red : MOLTEN.green;
  const seam = edge < 0.012 || faceEdge < 0.012;
  const hc = honeycomb(f.along + 2, f.across + 2, 0.045);
  if (seam) return { c: shade(c, 0.62), b: 40 };
  return { c: shade(c, 0.94 + hc * 0.06), b: 150 + hc * 90 };
}

function beachPixel(x: number, y: number, z: number, u: number): { c: RGB; b: number } {
  const lat = Math.asin(Math.max(-1, Math.min(1, y)));
  const SECT = 10;
  // swirl: panels twist toward the poles (pin-wheel), 10 panels alternating yellow / blue
  const tw = u + 0.2 * Math.sin(lat * 2.2) + 0.05 * Math.sin(lat * 6);
  const f = tw * SECT;
  const idx = ((Math.floor(f) % SECT) + SECT) % SECT;
  const fr = f - Math.floor(f);
  let c: RGB = idx % 2 === 0 ? BEACH.yellow : BEACH.blue;
  if (idx % 2 === 1) {
    if (fr > 0.62 && fr < 0.8 && Math.abs(lat) < 1.3) c = BEACH.white;
    else if (fr > 0.8 && fr < 0.86 && Math.abs(lat) < 1.25) c = BEACH.red;
  }
  const seamW = 0.02 / Math.max(0.22, Math.cos(lat));
  const seam = Math.min(fr, 1 - fr) < seamW;
  const polar = Math.abs(lat) > 1.48;
  if (polar) c = BEACH.blue;
  const fc = cubeFace(x, y, z);
  const dp = dimples(fc.along + 2, fc.across + 2, 0.05);
  if (seam && !polar) return { c: shade(c, 0.55), b: 40 };
  return { c: shade(c, 0.95 + dp * 0.05), b: 150 + dp * 90 };
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
    const theta = (j / H) * Math.PI; // 0 top → π bottom
    const st = Math.sin(theta), ct = Math.cos(theta);
    for (let i = 0; i < W; i++) {
      const u = i / W;
      const phi = u * Math.PI * 2;
      // same parametrisation as THREE.SphereGeometry
      const x = -Math.cos(phi) * st, y = ct, z = Math.sin(phi) * st;
      const { c, b } = design === 'molten' ? moltenPixel(x, y, z) : beachPixel(x, y, z, u);
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
  useFrame((_, dt) => {
    if (spin && ref.current) ref.current.rotation.y += dt * 0.35;
  });
  return (
    <mesh ref={ref} rotation={[0.42, 0.6, 0.18]}>
      <sphereGeometry args={[1, 128, 96]} />
      <meshPhysicalMaterial map={tex.map} bumpMap={tex.bumpMap} bumpScale={design === 'molten' ? 1.4 : 1.1}
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
      <OrbitControls enableZoom={false} enablePan={false} autoRotate={!still} autoRotateSpeed={0.6} />
    </Canvas>
  );
}
