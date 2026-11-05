import { Canvas, useFrame } from '@react-three/fiber';
import { ContactShadows, OrbitControls } from '@react-three/drei';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';

/**
 * Procedural volleyball in the classic blue/yellow "curved panel" look.
 * No logos or brand marks — texture is generated at runtime on a canvas.
 */
function makeTextures(c1: string, c2: string) {
  const W = 1024, H = 512;
  const col = document.createElement('canvas');
  col.width = W;
  col.height = H;
  const bump = document.createElement('canvas');
  bump.width = W;
  bump.height = H;
  const cx = col.getContext('2d')!;
  const bx = bump.getContext('2d')!;
  const ci = cx.createImageData(W, H);
  const bi = bx.createImageData(W, H);
  const hex = (h: string) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const A = hex(c1), B = hex(c2), WHITE = [250, 250, 246];
  const SECT = 6;
  for (let j = 0; j < H; j++) {
    const v = 1 - (2 * j) / H; // 1 top → -1 bottom
    const lat = (v * Math.PI) / 2;
    for (let i = 0; i < W; i++) {
      const u = i / W;
      // S-shaped twist → curved panels
      const tw = u + 0.22 * Math.sin(lat * 2) + 0.06 * Math.sin(lat * 5);
      const f = tw * SECT;
      const idx = ((Math.floor(f) % SECT) + SECT) % SECT;
      const fr = f - Math.floor(f);
      // a thin white accent stripe inside every blue panel
      let c = idx % 2 === 0 ? A : B;
      if (idx % 2 === 1 && fr > 0.44 && fr < 0.56 && Math.abs(v) < 0.86) c = WHITE;
      // seams (panel edges) — narrower near poles
      const seamW = 0.018 / Math.max(0.25, Math.cos(lat));
      const seam = Math.min(fr, 1 - fr) < seamW;
      const polar = Math.abs(v) > 0.965;
      const o = (j * W + i) * 4;
      const shade = seam ? 0.55 : 1;
      const cc = polar ? A : c;
      ci.data[o] = cc[0] * shade;
      ci.data[o + 1] = cc[1] * shade;
      ci.data[o + 2] = cc[2] * shade;
      ci.data[o + 3] = 255;
      // bump: seams are grooves, tiny dimples everywhere (micro-fiber look)
      const dimple = ((i * 13) ^ (j * 7)) % 9 === 0 ? 210 : 235;
      const b = seam ? 60 : dimple;
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
  return { map, bumpMap };
}

function Ball({ colors }: { colors: [string, string] }) {
  const ref = useRef<THREE.Mesh>(null);
  const { map, bumpMap } = useMemo(() => makeTextures(colors[0], colors[1]), [colors]);
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += dt * 0.35;
  });
  return (
    <mesh ref={ref} rotation={[0.35, 0, 0.25]} castShadow>
      <sphereGeometry args={[1, 96, 64]} />
      <meshStandardMaterial map={map} bumpMap={bumpMap} bumpScale={0.6} roughness={0.55} metalness={0.02} />
    </mesh>
  );
}

export default function Ball3D({ still = false, colors = ['#FFC72C', '#1565C0'] }: { still?: boolean; colors?: [string, string] }) {
  return (
    <Canvas camera={{ position: [0, 0.3, 3.4], fov: 40 }} dpr={[1, 2]} gl={{ antialias: true, alpha: true }} frameloop={still ? 'demand' : 'always'}>
      <ambientLight intensity={0.55} />
      <directionalLight position={[3, 4, 5]} intensity={2.2} />
      <directionalLight position={[-4, -1, -2]} intensity={0.6} color="#9fc3ff" />
      <pointLight position={[0, 3, 2]} intensity={6} distance={8} />
      {still ? (
        <mesh rotation={[0.35, 0.6, 0.25]}>
          <sphereGeometry args={[1, 96, 64]} />
          <meshStandardMaterial {...makeTextures(colors[0], colors[1])} roughness={0.55} />
        </mesh>
      ) : (
        <Ball colors={colors} />
      )}
      <ContactShadows position={[0, -1.25, 0]} opacity={0.35} scale={5} blur={2.6} far={2} />
      <OrbitControls enableZoom={false} enablePan={false} autoRotate={!still} autoRotateSpeed={0.8} />
    </Canvas>
  );
}
