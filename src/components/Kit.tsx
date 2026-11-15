// Kit de componentes 3D low poly reutilizáveis: estrada, árvores, carro, barra neon, feixe, etiqueta.
import React, {useLayoutEffect, useMemo, useRef} from 'react';
import * as THREE from 'three';
import {beamTexture, glowTexture, labelTexture} from './labelTexture';

// gerador pseudo-aleatório determinístico (mesmo resultado em todo frame/render)
export const rng = (seed: number) => () => {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

// ---------------- ESTRADA ----------------
const DASH_P = 8;
export const Road: React.FC<{travel: number; lanes: number[]}> = ({travel, lanes}) => {
  const half = (lanes[lanes.length - 1] - lanes[0]) / 2 + 1.5;
  const dividers = lanes.slice(0, -1).map((x, i) => (x + lanes[i + 1]) / 2);
  const dashRef = useRef<THREE.InstancedMesh>(null);
  const postRef = useRef<THREE.InstancedMesh>(null);
  const nDash = 34;
  useLayoutEffect(() => {
    const m = new THREE.Matrix4();
    let k = 0;
    for (const x of dividers)
      for (let j = 0; j < nDash; j++) {
        m.makeTranslation(x, 0.02, 20 - j * DASH_P);
        dashRef.current!.setMatrixAt(k++, m);
      }
    dashRef.current!.instanceMatrix.needsUpdate = true;
    k = 0;
    for (const s of [-1, 1])
      for (let j = 0; j < 70; j++) {
        m.makeTranslation(s * (half + 1.1), 0.45, 20 - j * 4);
        postRef.current!.setMatrixAt(k++, m);
      }
    postRef.current!.instanceMatrix.needsUpdate = true;
  }, []);
  const off = travel % DASH_P;
  return (
    <group>
      {/* chão / grama */}
      <mesh rotation-x={-Math.PI / 2} position={[0, -0.02, -120]}>
        <planeGeometry args={[400, 320]} />
        <meshStandardMaterial color="#16241c" roughness={1} />
      </mesh>
      {/* asfalto */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0, -120]}>
        <planeGeometry args={[half * 2 + 1.6, 320]} />
        <meshStandardMaterial color="#2b2f36" roughness={0.9} />
      </mesh>
      {/* linhas laterais contínuas */}
      {[-1, 1].map((s) => (
        <mesh key={s} rotation-x={-Math.PI / 2} position={[s * (half - 0.25), 0.015, -120]}>
          <planeGeometry args={[0.22, 320]} />
          <meshBasicMaterial color="#e9edf2" />
        </mesh>
      ))}
      {/* faixas tracejadas (rolam para dar movimento) */}
      <group position-z={off}>
        <instancedMesh ref={dashRef} args={[undefined, undefined, dividers.length * nDash]}>
          <boxGeometry args={[0.2, 0.01, 3]} />
          <meshBasicMaterial color="#dfe4ea" />
        </instancedMesh>
      </group>
      {/* guard-rail */}
      <group position-z={travel % 4}>
        <instancedMesh ref={postRef} args={[undefined, undefined, 140]}>
          <boxGeometry args={[0.15, 0.9, 0.15]} />
          <meshStandardMaterial color="#8a9099" />
        </instancedMesh>
      </group>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * (half + 1.1), 0.8, -120]}>
          <boxGeometry args={[0.08, 0.25, 320]} />
          <meshStandardMaterial color="#aab0b8" metalness={0.4} roughness={0.5} />
        </mesh>
      ))}
    </group>
  );
};

// ---------------- ÁRVORES (instanciadas) ----------------
const TREE_P = 60;
export const Trees: React.FC<{travel: number; roadHalf: number; seed?: number}> = ({travel, roadHalf, seed = 7}) => {
  const trunk = useRef<THREE.InstancedMesh>(null);
  const crown = useRef<THREE.InstancedMesh>(null);
  const data = useMemo(() => {
    const r = rng(seed);
    const base: {x: number; z: number; s: number; c: THREE.Color}[] = [];
    const palette = ['#24603f', '#2c6e47', '#1f5135', '#357a50', '#1d4630'].map((c) => new THREE.Color(c));
    for (const side of [-1, 1])
      for (let col = 0; col < 7; col++)
        for (let z = 0; z > -TREE_P; z -= 4.2 + r() * 2) {
          const x = side * (roadHalf + 4 + col * 4.5 + r() * 2.5);
          base.push({x, z: z - r() * 2, s: 0.8 + r() * 0.7 + col * 0.05, c: palette[Math.floor(r() * palette.length)]});
        }
    const all = [] as typeof base;
    for (let k = -1; k < 5; k++) for (const t of base) all.push({...t, z: t.z - k * TREE_P});
    return all;
  }, [roadHalf, seed]);
  useLayoutEffect(() => {
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    data.forEach((t, i) => {
      m.compose(new THREE.Vector3(t.x, 1.6 * t.s, t.z), q, new THREE.Vector3(t.s, t.s, t.s));
      trunk.current!.setMatrixAt(i, m);
      q.setFromEuler(new THREE.Euler(0, (i * 1.7) % 6.28, 0));
      m.compose(new THREE.Vector3(t.x, 4.6 * t.s, t.z), q, new THREE.Vector3(t.s * 1.1, t.s, t.s * 1.1));
      crown.current!.setMatrixAt(i, m);
      crown.current!.setColorAt(i, t.c);
      q.identity();
    });
    trunk.current!.instanceMatrix.needsUpdate = true;
    crown.current!.instanceMatrix.needsUpdate = true;
    crown.current!.instanceColor!.needsUpdate = true;
  }, [data]);
  return (
    <group position-z={travel % TREE_P}>
      <instancedMesh ref={trunk} args={[undefined, undefined, data.length]}>
        <cylinderGeometry args={[0.28, 0.38, 3.2, 6]} />
        <meshStandardMaterial color="#20170f" flatShading />
      </instancedMesh>
      <instancedMesh ref={crown} args={[undefined, undefined, data.length]}>
        <icosahedronGeometry args={[2.6, 1]} />
        <meshStandardMaterial flatShading roughness={1} />
      </instancedMesh>
    </group>
  );
};

// ---------------- ETIQUETA (sprite) ----------------
export const Label: React.FC<{
  text: string; border: string; position: [number, number, number]; height?: number; opacity?: number; color?: string;
  esquerda?: boolean;
}> = ({text, border, position, height = 1.1, opacity = 1, color, esquerda}) => {
  const tex = labelTexture(text, border, color);
  const aspect = (tex as any).userData.aspect;
  if (opacity <= 0.01) return null;
  if (esquerda) position = [position[0] + (height * aspect * opacity) / 2, position[1], position[2]];
  return (
    <sprite position={position} scale={[height * aspect * opacity, height * opacity, 1]} renderOrder={10}>
      <spriteMaterial map={tex} transparent opacity={opacity} depthTest={false} depthWrite={false} fog={false} />
    </sprite>
  );
};

// ---------------- CARRO ----------------
export const Car: React.FC<{color: string; position: [number, number, number]; frame: number; brilho?: number}> = ({
  color, position, frame, brilho = 1,
}) => {
  const glow = glowTexture();
  const bounce = Math.sin(frame * 0.9 + position[0]) * 0.012;
  const wheelRot = -frame * 0.5;
  const c = new THREE.Color(color);
  const dark = c.clone().multiplyScalar(0.55);
  return (
    <group position={position}>
      <group position-y={bounce}>
        {/* carroceria */}
        <mesh position={[0, 0.62, 0]}>
          <boxGeometry args={[1.95, 0.62, 4.1]} />
          <meshStandardMaterial color={c} flatShading roughness={0.55} />
        </mesh>
        {/* cabine */}
        <mesh position={[0, 1.18, 0.25]}>
          <boxGeometry args={[1.62, 0.55, 2.1]} />
          <meshStandardMaterial color={dark} flatShading roughness={0.4} />
        </mesh>
        {/* vidro traseiro */}
        <mesh position={[0, 1.18, 1.31]}>
          <planeGeometry args={[1.45, 0.42]} />
          <meshStandardMaterial color="#9fb3c8" emissive="#2a3a4a" roughness={0.2} />
        </mesh>
        {/* para-choque */}
        <mesh position={[0, 0.36, 2.07]}>
          <boxGeometry args={[1.9, 0.18, 0.08]} />
          <meshStandardMaterial color="#1b1d21" />
        </mesh>
        {/* lanternas */}
        {[-0.7, 0.7].map((x) => (
          <group key={x} position={[x, 0.72, 2.06]}>
            <mesh>
              <boxGeometry args={[0.42, 0.14, 0.04]} />
              <meshBasicMaterial color={new THREE.Color('#ff2a1f').multiplyScalar(1 + brilho)} toneMapped={false} />
            </mesh>
            <sprite scale={[1.2 + brilho * 0.5, 0.75 + brilho * 0.3, 1]} position-z={0.05}>
              <spriteMaterial map={glow} color="#ff3b2a" transparent opacity={0.55 + 0.35 * brilho} blending={THREE.AdditiveBlending} depthWrite={false} />
            </sprite>
          </group>
        ))}
      </group>
      {/* rodas */}
      {[-0.95, 0.95].flatMap((x) =>
        [-1.3, 1.3].map((z) => (
          <mesh key={`${x}${z}`} position={[x, 0.36, z]} rotation={[wheelRot, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.36, 0.36, 0.3, 8]} />
            <meshStandardMaterial color="#121316" flatShading />
          </mesh>
        )),
      )}
      {/* reflexo vermelho no asfalto */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.03, 3.4]}>
        <planeGeometry args={[2.2, 2.6]} />
        <meshBasicMaterial map={glow} color="#ff2a1f" transparent opacity={0.35 + 0.25 * brilho} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      {/* sombra */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.025, 0]}>
        <planeGeometry args={[2.6, 4.8]} />
        <meshBasicMaterial map={glow} color="#000000" transparent opacity={0.55} depthWrite={false} />
      </mesh>
    </group>
  );
};

// ---------------- BARRA NEON ----------------
export const NeonBar: React.FC<{
  position: [number, number, number]; height: number; grow: number; color: string; label: string;
}> = ({position, height, grow, color, label}) => {
  if (grow <= 0.01) return null;
  const h = Math.max(0.05, height * grow);
  const rings = Math.floor(height / 0.5);
  const col = new THREE.Color(color);
  return (
    <group position={position}>
      <mesh position-y={h / 2}>
        <cylinderGeometry args={[0.72, 0.72, h, 20, 1, true]} />
        <meshBasicMaterial color={col} transparent opacity={0.28} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} depthWrite={false} fog={false} />
      </mesh>
      <mesh position-y={h / 2}>
        <cylinderGeometry args={[1.0, 1.0, h, 20, 1, true]} />
        <meshBasicMaterial color={col} transparent opacity={0.1} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} depthWrite={false} fog={false} />
      </mesh>
      {Array.from({length: rings + 1}, (_, k) => k * 0.5)
        .filter((y) => y <= h)
        .map((y) => (
          <mesh key={y} position-y={y} rotation-x={Math.PI / 2}>
            <torusGeometry args={[0.72, 0.035, 4, 24]} />
            <meshBasicMaterial color={col.clone().multiplyScalar(1.6)} transparent opacity={0.85} blending={THREE.AdditiveBlending} depthWrite={false} fog={false} />
          </mesh>
        ))}
      {/* tampa brilhante */}
      <mesh position-y={h} rotation-x={-Math.PI / 2}>
        <circleGeometry args={[0.72, 20]} />
        <meshBasicMaterial color={col.clone().multiplyScalar(1.4)} transparent opacity={0.6} blending={THREE.AdditiveBlending} depthWrite={false} fog={false} />
      </mesh>
      <Label text={label} border={color} position={[0, h + 1.0, 0]} height={1.15} opacity={Math.min(1, grow * 1.5)} />
    </group>
  );
};

// ---------------- FEIXE DE LUZ (distância) ----------------
export const LightBeam: React.FC<{x: number; zStart: number; length: number; grow: number; label: string}> = ({
  x, zStart, length, grow, label,
}) => {
  if (grow <= 0.01) return null;
  const L = length * grow;
  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} position={[x, 0.05, zStart - L / 2]}>
        <planeGeometry args={[1.1, L]} />
        <meshBasicMaterial map={beamTexture()} transparent blending={THREE.AdditiveBlending} depthWrite={false} fog={false} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[x, 0.04, zStart - L / 2]}>
        <planeGeometry args={[3.2, L]} />
        <meshBasicMaterial map={beamTexture()} color="#9fd8ff" transparent opacity={0.25} blending={THREE.AdditiveBlending} depthWrite={false} fog={false} />
      </mesh>
      <Label text={label} border="#e8f4ff" position={[x + 1.6, 3.2, zStart - Math.min(L, length * 0.42)]} height={1.6} opacity={Math.min(1, grow * 1.3)} />
    </group>
  );
};
