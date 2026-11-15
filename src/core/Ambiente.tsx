// Cenário noturno padrão para vídeos fora da estrada: chão escuro, grade neon sutil e anel de árvores low poly.
import React, {useLayoutEffect, useMemo, useRef} from 'react';
import * as THREE from 'three';
import {rng} from '../components/Kit';

export const Luzes: React.FC = () => (
  <>
    <fog attach="fog" args={['#141d31', 40, 150]} />
    <hemisphereLight args={['#7f93d0', '#24382a', 1.25]} />
    <directionalLight position={[-12, 25, 30]} intensity={1.6} color="#c4d0ff" />
    <directionalLight position={[20, 10, -40]} intensity={0.35} color="#7aa0ff" />
    <ambientLight intensity={0.25} />
  </>
);

export const Chao: React.FC<{grade?: boolean}> = ({grade = true}) => (
  <group>
    <mesh rotation-x={-Math.PI / 2} position={[0, -0.01, -20]}>
      <planeGeometry args={[400, 400]} />
      <meshStandardMaterial color="#16241c" roughness={1} />
    </mesh>
    <mesh rotation-x={-Math.PI / 2} position={[0, 0, -4]}>
      <circleGeometry args={[17, 48]} />
      <meshStandardMaterial color="#232832" roughness={0.9} />
    </mesh>
    {grade && <gridHelper args={[34, 17, '#2f6f8f', '#1f3f55']} position={[0, 0.02, -4]} />}
  </group>
);

export const AnelArvores: React.FC<{seed?: number; livreX?: number; livreZ?: number}> = ({seed = 3, livreX = 16, livreZ = -14}) => {
  const trunk = useRef<THREE.InstancedMesh>(null);
  const crown = useRef<THREE.InstancedMesh>(null);
  const data = useMemo(() => {
    const r = rng(seed);
    const pal = ['#24603f', '#2c6e47', '#1f5135', '#357a50', '#1d4630'].map((c) => new THREE.Color(c));
    const out: {x: number; z: number; s: number; c: THREE.Color}[] = [];
    while (out.length < 260) {
      const ang = r() * Math.PI * 2;
      const rad = 26 + r() * 60;
      const x = Math.cos(ang) * rad;
      const z = Math.sin(ang) * rad - 6;
      if (Math.abs(x) < livreX && z > livreZ) continue; // deixa livre a área entre câmera e cena
      out.push({x, z, s: 0.9 + r() * 0.9, c: pal[Math.floor(r() * pal.length)]});
    }
    return out;
  }, [seed, livreX, livreZ]);
  useLayoutEffect(() => {
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    data.forEach((t, i) => {
      m.compose(new THREE.Vector3(t.x, 1.6 * t.s, t.z), new THREE.Quaternion(), new THREE.Vector3(t.s, t.s, t.s));
      trunk.current!.setMatrixAt(i, m);
      q.setFromEuler(new THREE.Euler(0, i * 1.7, 0));
      m.compose(new THREE.Vector3(t.x, 4.6 * t.s, t.z), q, new THREE.Vector3(t.s * 1.1, t.s, t.s * 1.1));
      crown.current!.setMatrixAt(i, m);
      crown.current!.setColorAt(i, t.c);
    });
    trunk.current!.instanceMatrix.needsUpdate = true;
    crown.current!.instanceMatrix.needsUpdate = true;
    crown.current!.instanceColor!.needsUpdate = true;
  }, [data]);
  return (
    <group>
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

// Coluna neon genérica (mesmo visual das barras de tempo), com altura livre.
export const Coluna: React.FC<{
  position: [number, number, number]; h: number; cor: string; raio?: number; brilho?: number; opacidade?: number;
}> = ({position, h, cor, raio = 0.55, brilho = 1, opacidade = 1}) => {
  if (opacidade <= 0.01 || h <= 0.001) return null;
  const col = new THREE.Color(cor);
  const passo = 0.45;
  const n = Math.min(60, Math.floor(h / passo));
  const add = {transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false} as const;
  return (
    <group position={position}>
      <mesh position-y={h / 2}>
        <cylinderGeometry args={[raio, raio, h, 18, 1, true]} />
        <meshBasicMaterial color={col} opacity={(0.18 + 0.2 * brilho) * opacidade} side={THREE.DoubleSide} {...add} />
      </mesh>
      <mesh position-y={h / 2}>
        <cylinderGeometry args={[raio * 1.38, raio * 1.38, h, 18, 1, true]} />
        <meshBasicMaterial color={col} opacity={(0.05 + 0.08 * brilho) * opacidade} side={THREE.DoubleSide} {...add} />
      </mesh>
      {Array.from({length: n + 1}, (_, k) => (
        <mesh key={k} position-y={k * passo} rotation-x={Math.PI / 2}>
          <torusGeometry args={[raio, 0.03, 4, 20]} />
          <meshBasicMaterial color={col.clone().multiplyScalar(1.2 + 0.6 * brilho)} opacity={(0.4 + 0.5 * brilho) * opacidade} {...add} />
        </mesh>
      ))}
      <mesh position-y={h} rotation-x={-Math.PI / 2}>
        <circleGeometry args={[raio, 18]} />
        <meshBasicMaterial color={col.clone().multiplyScalar(1.4)} opacity={(0.3 + 0.4 * brilho) * opacidade} {...add} />
      </mesh>
    </group>
  );
};

// Linha neon reta entre dois pontos (caixa fina)
export const LinhaNeon: React.FC<{a: number[]; b: number[]; cor: string; espessura?: number; opacidade?: number}> = ({
  a, b, cor, espessura = 0.08, opacidade = 1,
}) => {
  if (opacidade <= 0.01) return null;
  const va = new THREE.Vector3(...(a as [number, number, number]));
  const vb = new THREE.Vector3(...(b as [number, number, number]));
  const len = va.distanceTo(vb);
  if (len < 1e-4) return null;
  const mid = va.clone().add(vb).multiplyScalar(0.5);
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(1, 0, 0), vb.clone().sub(va).normalize());
  const col = new THREE.Color(cor);
  return (
    <group position={mid} quaternion={q}>
      <mesh>
        <boxGeometry args={[len, espessura, espessura]} />
        <meshBasicMaterial color={col.clone().multiplyScalar(1.5)} transparent opacity={opacidade} fog={false} />
      </mesh>
      <mesh>
        <boxGeometry args={[len, espessura * 4, espessura * 4]} />
        <meshBasicMaterial color={col} transparent opacity={0.18 * opacidade} blending={THREE.AdditiveBlending} depthWrite={false} fog={false} />
      </mesh>
    </group>
  );
};
