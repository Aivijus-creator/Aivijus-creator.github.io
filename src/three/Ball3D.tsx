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

const MOLTEN = { white: hex('#F6F5F1'), green: hex('#00753A'), red: hex('#C0121D'), seam: hex('#C9C9C2') };
const BEACH = { yellow: hex('#FFD31C'), blue: hex('#1E3FA8'), white: hex('#F8F8F5'), purple: hex('#7B3FB2'), red: hex('#E8383F'), orange: hex('#F7942A') };

/** Cube-face projection: local coords in [-1, 1], used for even micro-textures. */
function cubeFace(x: number, y: number, z: number) {
  const ax = Math.abs(x), ay = Math.abs(y), az = Math.abs(z);
  const c = [x, y, z];
  const i = ax >= ay && ax >= az ? 0 : ay >= az ? 1 : 2;
  const m = Math.max(ax, ay, az);
  return { along: c[(i + 1) % 3] / m, across: c[(i + 2) % 3] / m };
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
  const f = lat - 0.55 * Math.sin(lon) + 0.16 * Math.sin(3 * lon) + 0.06 * Math.sin(2 * lon);
  const n = Math.round(f / W);
  const fr = f / W - n; // −0.5 … 0.5 inside a band
  const cyc: RGB[] = [MOLTEN.white, MOLTEN.red, MOLTEN.green];
  let c = cyc[((n % 3) + 3) % 3];
  const fc = cubeFace(x, y, z);
  // V5M4000: smooth synthetic leather with a fine pebble grain
  const hc = dimples(fc.along + 2, fc.across + 2, 0.03);
  c = shade(c, 0.97 + hc * 0.03);
  const seam = 0.5 - Math.abs(fr) < 0.018;
  if (seam) return { c: MOLTEN.seam, b: 60 };
  return { c, b: 200 + hc * 35 };
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

function drawText(ctx: CanvasRenderingContext2D, W: number, H: number, o: { text: string; color: string; y: number; size: number; slant?: number; stroke?: string; spacing?: number; scaleX?: number }) {
  ctx.save();
  ctx.translate(W / 2, H / 2 + o.y);
  ctx.transform(o.scaleX ?? 1, 0, -(o.slant ?? 0), 1, 0, 0);
  ctx.font = `900 ${o.size}px "Arial Black", "Helvetica Neue", Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  if ('letterSpacing' in ctx && o.spacing !== undefined) (ctx as unknown as { letterSpacing: string }).letterSpacing = `${o.spacing}px`;
  if (o.stroke) {
    ctx.lineWidth = o.size * 0.06;
    ctx.strokeStyle = o.stroke;
    ctx.strokeText(o.text, 0, 0);
  } else {
    ctx.fillStyle = o.color;
    ctx.fillText(o.text, 0, 0);
  }
  ctx.restore();
}

/** "molten" wordmark with the round, flame-cut "o". */
function drawMoltenLogo(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number) {
  ctx.save();
  ctx.font = `900 ${size}px "Arial Black", "Helvetica Neue", Arial, sans-serif`;
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#111111';
  const m = ctx.measureText('m').width * 0.98;
  const lten = ctx.measureText('lten').width;
  const oW = size * 0.66;
  const gap = size * 0.03;
  const total = m + gap + oW + gap + lten;
  let x = cx - total / 2;
  const base = cy + size * 0.36;
  ctx.fillText('m', x, base);
  x += m + gap;
  // "o": thick ring with a teardrop flame inside
  const ocx = x + oW / 2, ocy = base - size * 0.36;
  const R = oW / 2;
  ctx.beginPath();
  ctx.arc(ocx, ocy, R, 0, Math.PI * 2);
  ctx.arc(ocx, ocy, R * 0.52, 0, Math.PI * 2, true);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(ocx + R * 0.05, ocy - R * 0.5);
  ctx.bezierCurveTo(ocx + R * 0.45, ocy - R * 0.05, ocx + R * 0.25, ocy + R * 0.45, ocx - R * 0.05, ocy + R * 0.42);
  ctx.bezierCurveTo(ocx - R * 0.35, ocy + R * 0.35, ocx - R * 0.3, ocy - R * 0.05, ocx + R * 0.05, ocy - R * 0.5);
  ctx.fill();
  x += oW + gap;
  ctx.fillText('lten', x, base);
  // ® mark
  ctx.font = `700 ${size * 0.16}px Arial, sans-serif`;
  ctx.fillText('®', x + lten + size * 0.02, base - size * 0.62);
  ctx.restore();
}

/** Outlined "4000" with the size badge below, as printed on the red panel. */
function drawModelNumber(ctx: CanvasRenderingContext2D, cx: number, cy: number) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(1.55, 1);
  ctx.font = `700 46px "Arial", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  if ('letterSpacing' in ctx) (ctx as unknown as { letterSpacing: string }).letterSpacing = '10px';
  ctx.lineWidth = 3;
  ctx.strokeStyle = 'rgba(255,240,240,0.85)';
  ctx.strokeText('4000', 0, 0);
  ctx.restore();
  // size badge "5"
  ctx.save();
  ctx.fillStyle = 'rgba(255,245,245,0.9)';
  ctx.beginPath();
  ctx.arc(cx, cy + 46, 15, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#C81E28';
  ctx.font = '700 20px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('5', cx, cy + 47);
  ctx.font = '600 9px Arial, sans-serif';
  ctx.fillStyle = 'rgba(255,240,240,0.8)';
  ctx.fillText('Size', cx, cy + 70);
  ctx.restore();
}

/** "OFFICIAL / SIZE AND WEIGHT" on the green panel. */
function drawOfficial(ctx: CanvasRenderingContext2D, cx: number, cy: number) {
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(10,40,20,0.85)';
  if ('letterSpacing' in ctx) (ctx as unknown as { letterSpacing: string }).letterSpacing = '9px';
  ctx.font = '500 30px Arial, sans-serif';
  ctx.fillText('OFFICIAL', cx, cy);
  if ('letterSpacing' in ctx) (ctx as unknown as { letterSpacing: string }).letterSpacing = '3px';
  ctx.font = '600 12px Arial, sans-serif';
  ctx.fillText('SIZE AND WEIGHT', cx, cy + 26);
  ctx.restore();
}

function drawStar(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 ? r * 0.45 : r;
    ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  ctx.closePath();
  ctx.fill();
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
  // printed marks, placed like on the real balls
  if (design === 'molten') {
    drawModelNumber(cx, W / 2, H / 2 - H * 0.19);
    drawMoltenLogo(cx, W / 2, H / 2, 112);
    drawOfficial(cx, W / 2, H / 2 + H * 0.17);
  } else {
    drawText(cx, W, H, { text: 'BEACH PRO', color: '#111111', y: -H * 0.155, size: 84, slant: 0.12, scaleX: 1.05 });
    drawText(cx, W, H, { text: 'MIKASA', color: '#1B2A8C', y: H * 0.005, size: 112, slant: 0.04, spacing: 0, scaleX: 1.12 });
    drawStar(cx, W / 2 - 10, H / 2 - H * 0.075, 20, '#1B2A8C');
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
        roughness={design === 'molten' ? 0.62 : 0.5} clearcoat={0.1} clearcoatRoughness={0.6} envMapIntensity={0.22} />
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
