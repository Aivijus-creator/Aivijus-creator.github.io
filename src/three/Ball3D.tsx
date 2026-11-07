import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber';
import { ContactShadows, OrbitControls } from '@react-three/drei';
import { Suspense, useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

/** The indoor ball (Molten, 18 panels), the only ball the site shows. */
export type BallDesign = 'molten';

/** Soft studio reflections without downloading an HDR file. */
function Studio({ intensity = 1 }: { intensity?: number }) {
  const { gl, scene } = useThree();
  useEffect(() => {
    const pm = new THREE.PMREMGenerator(gl);
    const env = pm.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = env;
    scene.environmentIntensity = intensity;
    return () => {
      scene.environment = null;
      env.dispose();
      pm.dispose();
    };
  }, [gl, scene, intensity]);
  return null;
}

/**
 * Indoor ball rebuilt from the product photo (img2threejs pipeline): 18 panels, photo-projected prints,
 * FLISTATEC honeycomb relief, matte microfibre. Maps live in public/ball/ (baked equirectangular).
 */
const MOLTEN_MAPS = ['ball-albedo.jpg', 'ball-bump.jpg', 'ball-disp.jpg', 'ball-rough.png'].map((f) => `${import.meta.env.BASE_URL}ball/${f}`);

function RebuiltMolten({ spin }: { spin: boolean }) {
  const ref = useRef<THREE.Mesh>(null);
  const gl = useThree((st) => st.gl);
  const [map, bump, disp, rough] = useLoader(THREE.TextureLoader, MOLTEN_MAPS);
  useMemo(() => {
    map.colorSpace = THREE.SRGBColorSpace;
    const a = gl.capabilities.getMaxAnisotropy();
    for (const t of [map, bump, rough]) {
      t.anisotropy = a;
      t.needsUpdate = true;
    }
  }, [map, bump, rough, gl]);
  useFrame(({ clock }) => {
    // gentle sway: the logo side stays in view; drag to look around
    if (spin && ref.current) ref.current.rotation.y = -Math.PI / 2 + Math.sin(clock.elapsedTime * 0.45) * 0.4;
  });
  return (
    <mesh ref={ref} rotation={[0, -Math.PI / 2, 0]}>
      <sphereGeometry args={[1, 256, 128]} />
      <meshPhysicalMaterial map={map} bumpMap={bump} bumpScale={3.2} displacementMap={disp} displacementScale={0.016} displacementBias={-0.011}
        roughnessMap={rough} roughness={1} metalness={0} sheen={0.4} sheenRoughness={0.85} sheenColor="#ffffff" specularIntensity={0.6} />
    </mesh>
  );
}

export default function Ball3D({ still = false }: { still?: boolean; design?: BallDesign }) {
  return (
    <Canvas camera={{ position: [0, 0, 6.6], fov: 22 }} dpr={[1, 2]}
      gl={{ antialias: true, alpha: true, toneMapping: THREE.NeutralToneMapping, toneMappingExposure: 1.05 }}
      frameloop={still ? 'demand' : 'always'}>
      <Studio intensity={0.4} />
      {/* soft studio light from the upper left that picks out the honeycomb and the seams */}
      <directionalLight position={[-4.2, 3.4, 3.6]} intensity={2.1} />
      <directionalLight position={[3.5, -1, 3]} intensity={0.22} />
      <directionalLight position={[2.5, 2, -4]} intensity={0.55} color="#e6eeff" />
      <Suspense fallback={null}>
        <RebuiltMolten spin={!still} />
      </Suspense>
      <ContactShadows position={[0, -1.2, 0]} opacity={0.4} scale={5} blur={2.4} far={2} />
      <OrbitControls enableZoom={false} enablePan={false} autoRotate={false} />
    </Canvas>
  );
}
