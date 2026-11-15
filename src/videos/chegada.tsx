// Vídeo: a chegada dos portugueses em 1500, praia ao amanhecer, aldeia, caravelas, cruz.
import React, {useLayoutEffect, useMemo, useRef} from 'react';
import * as THREE from 'three';
import {useCurrentFrame} from 'remotion';
import {Label, rng} from '../components/Kit';
import {CameraRig} from '../core/CameraRig';
import {clamp01, estadoGenerico, lerp} from '../core/mix';

const CAMERAS: Record<string, {pos: number[]; look: number[]}> = {
  mar: {pos: [0, 3.2, -2], look: [0, 4.5, 40]},
  praia: {pos: [0, 7, 30], look: [0, 2.5, -6]},
  aldeia: {pos: [7, 4.5, 6], look: [-1, 1.8, -12]},
  alta: {pos: [0, 34, 38], look: [0, 0, -4]},
  cruz: {pos: [6, 3.2, 14], look: [2, 3, 3]},
  navios: {pos: [-6, 4, 8], look: [0, 3.5, 30]},
};
const N_PESSOAS = 34;
const CRUZ: [number, number, number] = [2, 0, 3.5];

export const estadoChegada = (props: any, frame: number) =>
  estadoGenerico(
    props.cenas,
    frame,
    (c) => {
      const cam = CAMERAS[c.camera ?? 'praia'] ?? CAMERAS.praia;
      return {
        camPos: cam.pos, camLook: cam.look,
        navios: c.navios ?? 0, // 0 = no horizonte, 1 = ancorados perto da praia
        aldeia: c.aldeia ? 1 : 0,
        pessoas: c.pessoas ?? 0, // fração visível
        roca: c.roca ? 1 : 0,
        cruz: c.cruz ? 1 : 0,
        portugueses: c.portugueses ? 1 : 0,
        saque: c.saque ? 1 : 0,
        rotulos: c.rotulos ? 1 : 0,
        caixa: 0,
      };
    },
    {camPos: 50, camLook: 50, navios: 90, aldeia: 40, pessoas: 50, cruz: 30, portugueses: 30, saque: 60},
    (a) => ({...a, camPos: [0, 6, -10]}),
  );

// ---------- mar com ondas low poly ----------
const Mar: React.FC<{frame: number}> = ({frame}) => {
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(260, 200, 52, 40);
    g.rotateX(-Math.PI / 2);
    return g.toNonIndexed();
  }, []);
  const base = useMemo(() => Float32Array.from(geo.attributes.position.array as Float32Array), [geo]);
  const t = frame / 30;
  const pos = geo.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const x = base[i * 3], z = base[i * 3 + 2];
    pos.setY(i, Math.sin(x * 0.35 + t * 1.3) * 0.18 + Math.cos(z * 0.4 - t * 1.1) * 0.22);
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
  return (
    <mesh geometry={geo} position={[0, -0.35, 106]}>
      <meshStandardMaterial color="#2f8fa8" flatShading roughness={0.35} metalness={0.1} />
    </mesh>
  );
};

// ---------- floresta (instanced) ----------
const Floresta: React.FC = () => {
  const tronco = useRef<THREE.InstancedMesh>(null);
  const copa = useRef<THREE.InstancedMesh>(null);
  const data = useMemo(() => {
    const r = rng(21);
    const pal = ['#2f7a3a', '#3f8f3f', '#246b33', '#4f9a3a', '#1f5a2c'].map((c) => new THREE.Color(c));
    const out: {x: number; z: number; s: number; c: THREE.Color}[] = [];
    while (out.length < 240) {
      const x = (r() - 0.5) * 170;
      const z = -6 - r() * 90;
      if (Math.abs(x) < 15 && z > -24) continue; // clareira da aldeia
      out.push({x, z, s: 0.9 + r() * 1.1, c: pal[Math.floor(r() * pal.length)]});
    }
    return out;
  }, []);
  useLayoutEffect(() => {
    const m = new THREE.Matrix4();
    data.forEach((t, i) => {
      m.compose(new THREE.Vector3(t.x, 1.6 * t.s, t.z), new THREE.Quaternion(), new THREE.Vector3(t.s, t.s, t.s));
      tronco.current!.setMatrixAt(i, m);
      const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, i * 1.3, 0));
      m.compose(new THREE.Vector3(t.x, 4.4 * t.s, t.z), q, new THREE.Vector3(t.s * 1.2, t.s, t.s * 1.2));
      copa.current!.setMatrixAt(i, m);
      copa.current!.setColorAt(i, t.c);
    });
    tronco.current!.instanceMatrix.needsUpdate = true;
    copa.current!.instanceMatrix.needsUpdate = true;
    copa.current!.instanceColor!.needsUpdate = true;
  }, [data]);
  return (
    <group>
      <instancedMesh ref={tronco} args={[undefined, undefined, data.length]}>
        <cylinderGeometry args={[0.28, 0.4, 3.2, 5]} />
        <meshStandardMaterial color="#5a3a22" flatShading />
      </instancedMesh>
      <instancedMesh ref={copa} args={[undefined, undefined, data.length]}>
        <icosahedronGeometry args={[2.6, 0]} />
        <meshStandardMaterial flatShading roughness={1} />
      </instancedMesh>
    </group>
  );
};

const Coqueiro: React.FC<{p: [number, number, number]; inc: number}> = ({p, inc}) => (
  <group position={p} rotation-z={inc}>
    <mesh position-y={2.6}>
      <cylinderGeometry args={[0.16, 0.26, 5.2, 5]} />
      <meshStandardMaterial color="#8a6a44" flatShading />
    </mesh>
    {Array.from({length: 6}, (_, k) => (
      <mesh key={k} position-y={5.2} rotation={[0.9, (k / 6) * Math.PI * 2, 0]}>
        <coneGeometry args={[0.5, 3.4, 3]} />
        <meshStandardMaterial color="#3f9a3a" flatShading />
      </mesh>
    ))}
  </group>
);

// ---------- oca ----------
const Oca: React.FC<{p: [number, number, number]; s: number; v: number}> = ({p, s, v}) => {
  if (v <= 0.01) return null;
  return (
    <group position={p} scale={[s * v, s * v, s * v]}>
      <mesh position-y={0} scale={[1, 1.15, 1]}>
        <sphereGeometry args={[2, 7, 4, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#c9a35a" flatShading side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 0.6, 1.9]}>
        <boxGeometry args={[0.8, 1.2, 0.3]} />
        <meshStandardMaterial color="#3a2414" />
      </mesh>
    </group>
  );
};

// ---------- pessoa indígena ----------
const PELE_IND = ['#a8673f', '#94572f', '#b8774a', '#8a4f2a'];
export const Indigena: React.FC<{p: [number, number, number]; i: number; v: number; frame: number}> = ({p, i, v, frame}) => {
  if (v <= 0.01) return null;
  const k = rng(i * 13 + 5);
  const pele = PELE_IND[Math.floor(k() * PELE_IND.length)];
  const s = (0.85 + k() * 0.3) * v;
  const fase = k() * 6;
  const pena = k() > 0.55;
  const t = frame / 30;
  return (
    <group position={[p[0], p[1] + Math.abs(Math.sin(t * 2 + fase)) * 0.06, p[2]]} rotation-y={Math.sin(t * 0.7 + fase) * 0.4} scale={[s, s, s]}>
      <mesh position-y={0.85}>
        <cylinderGeometry args={[0.28, 0.22, 1.1, 6]} />
        <meshStandardMaterial color={pele} flatShading />
      </mesh>
      {/* faixa de urucum */}
      <mesh position-y={1.05}>
        <cylinderGeometry args={[0.29, 0.29, 0.1, 6]} />
        <meshStandardMaterial color="#c8301e" flatShading />
      </mesh>
      {/* tanga */}
      <mesh position-y={0.32}>
        <cylinderGeometry args={[0.24, 0.26, 0.16, 6]} />
        <meshStandardMaterial color="#6b4423" flatShading />
      </mesh>
      {[-1, 1].map((d) => (
        <mesh key={d} position={[d * 0.12, 0.12, 0]}>
          <cylinderGeometry args={[0.09, 0.08, 0.5, 5]} />
          <meshStandardMaterial color={pele} flatShading />
        </mesh>
      ))}
      <mesh position-y={1.66}>
        <icosahedronGeometry args={[0.3, 0]} />
        <meshStandardMaterial color={pele} flatShading />
      </mesh>
      <mesh position-y={1.8} scale={[1.05, 0.55, 1.05]}>
        <icosahedronGeometry args={[0.31, 0]} />
        <meshStandardMaterial color="#111" flatShading />
      </mesh>
      {pena &&
        [-0.25, 0, 0.25].map((a, j) => (
          <mesh key={j} position={[a * 0.6, 2.05, -0.1]} rotation-z={-a}>
            <coneGeometry args={[0.07, 0.5, 3]} />
            <meshStandardMaterial color={['#e9b21a', '#d9262c', '#1f9e6a'][j]} flatShading />
          </mesh>
        ))}
    </group>
  );
};

// ---------- português (armadura, gibão, chapéu) ----------
export const Portugues: React.FC<{p: [number, number, number]; i: number; v: number; frame: number}> = ({p, i, v, frame}) => {
  if (v <= 0.01) return null;
  const s = v * 1.05;
  const t = frame / 30;
  const gib = ['#7a1d2a', '#2a3a7a', '#3a3a3a'][i % 3];
  return (
    <group position={[p[0], p[1] + (1 - v) * 3, p[2]]} rotation-y={-0.5 + Math.sin(t + i) * 0.15} scale={[s, s, s]}>
      <mesh position-y={0.95}>
        <cylinderGeometry args={[0.34, 0.3, 1.2, 6]} />
        <meshStandardMaterial color={gib} flatShading />
      </mesh>
      <mesh position-y={1.2}>
        <cylinderGeometry args={[0.36, 0.36, 0.4, 6]} />
        <meshStandardMaterial color="#b8c0c8" metalness={0.6} roughness={0.3} flatShading />
      </mesh>
      {[-1, 1].map((d) => (
        <mesh key={d} position={[d * 0.14, 0.2, 0]}>
          <cylinderGeometry args={[0.1, 0.1, 0.6, 5]} />
          <meshStandardMaterial color="#1b1410" flatShading />
        </mesh>
      ))}
      <mesh position-y={1.72}>
        <icosahedronGeometry args={[0.3, 0]} />
        <meshStandardMaterial color="#f1c7a3" flatShading />
      </mesh>
      <mesh position={[0, 1.6, 0.18]} scale={[0.8, 0.6, 0.6]}>
        <icosahedronGeometry args={[0.28, 0]} />
        <meshStandardMaterial color="#4a2e1a" flatShading />
      </mesh>
      {/* capacete morion */}
      <mesh position-y={1.98}>
        <coneGeometry args={[0.38, 0.45, 6]} />
        <meshStandardMaterial color="#c9d0d8" metalness={0.7} roughness={0.25} flatShading />
      </mesh>
      <mesh position-y={1.84} rotation-x={Math.PI / 2}>
        <torusGeometry args={[0.42, 0.05, 3, 10]} />
        <meshStandardMaterial color="#c9d0d8" metalness={0.7} roughness={0.25} />
      </mesh>
    </group>
  );
};

// ---------- caravela ----------
const Caravela: React.FC<{p: [number, number, number]; s: number; frame: number; fase: number}> = ({p, s, frame, fase}) => {
  const t = frame / 30 + fase;
  const vela = (y: number, w: number, h: number) => (
    <group position={[0, y, 0.05]}>
      <mesh>
        <planeGeometry args={[w, h]} />
        <meshStandardMaterial color="#f3ead6" side={THREE.DoubleSide} flatShading />
      </mesh>
      <mesh position-z={0.03}>
        <boxGeometry args={[w * 0.18, h * 0.8, 0.02]} />
        <meshBasicMaterial color="#c8201a" />
      </mesh>
      <mesh position-z={0.03}>
        <boxGeometry args={[w * 0.7, h * 0.16, 0.02]} />
        <meshBasicMaterial color="#c8201a" />
      </mesh>
      <mesh position-z={-0.03}>
        <boxGeometry args={[w * 0.18, h * 0.8, 0.02]} />
        <meshBasicMaterial color="#c8201a" />
      </mesh>
      <mesh position-z={-0.03}>
        <boxGeometry args={[w * 0.7, h * 0.16, 0.02]} />
        <meshBasicMaterial color="#c8201a" />
      </mesh>
    </group>
  );
  return (
    <group position={[p[0], p[1] + Math.sin(t * 1.4) * 0.15, p[2]]} rotation={[Math.sin(t * 1.1) * 0.03, Math.PI / 2 + 0.35, Math.sin(t * 1.3) * 0.04]} scale={[s, s, s]}>
      {/* casco */}
      <mesh position-y={0.5}>
        <boxGeometry args={[1.8, 1.1, 6]} />
        <meshStandardMaterial color="#6b4423" flatShading />
      </mesh>
      <mesh position={[0, 0.5, 3.4]} rotation-x={Math.PI / 2}>
        <coneGeometry args={[0.9, 1.6, 4]} />
        <meshStandardMaterial color="#6b4423" flatShading />
      </mesh>
      <mesh position={[0, 1.4, -2.2]}>
        <boxGeometry args={[1.8, 0.9, 1.6]} />
        <meshStandardMaterial color="#5a3820" flatShading />
      </mesh>
      {/* mastros */}
      {[-0.8, 1.2].map((z, k) => (
        <group key={k} position={[0, 0, z]}>
          <mesh position-y={3.4}>
            <cylinderGeometry args={[0.07, 0.09, 5.6, 5]} />
            <meshStandardMaterial color="#3a2414" />
          </mesh>
          <group rotation-y={Math.PI / 2}>{vela(3.6 - k * 0.3, 3 - k * 0.4, 2.8 - k * 0.3)}</group>
        </group>
      ))}
      <mesh position={[0, 6.4, -0.8]}>
        <boxGeometry args={[0.02, 0.5, 0.9]} />
        <meshBasicMaterial color="#c8201a" />
      </mesh>
    </group>
  );
};

// ---------- cruz ----------
const Cruz: React.FC<{v: number}> = ({v}) => {
  if (v <= 0.01) return null;
  return (
    <group position={[CRUZ[0], (v - 1) * 5.5, CRUZ[2]]}>
      <mesh position-y={2.6}>
        <boxGeometry args={[0.32, 5.2, 0.32]} />
        <meshStandardMaterial color="#6b4423" flatShading />
      </mesh>
      <mesh position-y={3.9}>
        <boxGeometry args={[2.4, 0.3, 0.3]} />
        <meshStandardMaterial color="#6b4423" flatShading />
      </mesh>
    </group>
  );
};

// ---------- toras de pau-brasil ----------
const Toras: React.FC<{v: number}> = ({v}) => {
  if (v <= 0.01) return null;
  const n = Math.floor(v * 14);
  return (
    <group position={[-5, 0, 4.5]}>
      {Array.from({length: n}, (_, k) => {
        const row = Math.floor(k / 5), col = k % 5;
        return (
          <mesh key={k} position={[col * 0.62 + row * 0.31, 0.3 + row * 0.52, 0]} rotation-x={Math.PI / 2}>
            <cylinderGeometry args={[0.3, 0.3, 3.4, 6]} />
            <meshStandardMaterial color="#a02a1a" flatShading />
          </mesh>
        );
      })}
    </group>
  );
};

const posPessoas = (() => {
  const r = rng(77);
  const out: [number, number, number][] = [];
  for (let i = 0; i < N_PESSOAS; i++) {
    if (i < 12) out.push([(r() - 0.5) * 18, 0, 2 + r() * 4]); // na areia, olhando o mar
    else {
      const a = r() * Math.PI * 2, rad = 3 + r() * 7;
      out.push([Math.cos(a) * rad, 0, -14 + Math.sin(a) * rad * 0.7]);
    }
  }
  return out;
})();
const OCAS: [number, number, number][] = Array.from({length: 7}, (_, k) => {
  const a = (k / 7) * Math.PI * 2 + 0.3;
  return [Math.cos(a) * 9, 0, -15 + Math.sin(a) * 6];
});
const PORTUGUESES: [number, number, number][] = [[3.5, 0, 5.5], [0.6, 0, 6], [4.6, 0, 3.6], [-0.6, 0, 4.4], [2.2, 0, 6.8]];

export const MundoChegada: React.FC<{props: any}> = ({props}) => {
  const frame = useCurrentFrame();
  const st: any = estadoChegada(props, frame);
  const nav = st.navios;
  const naviosPos: [number, number, number][] = [
    [-6, 0, lerp(150, 24, nav)], [8, 0, lerp(165, 30, nav)], [-18, 0, lerp(175, 38, nav)], [20, 0, lerp(185, 44, nav)], [0, 0, lerp(200, 55, nav)],
  ];
  const vivos = 1 - 0.65 * st.saque; // a população some no fim
  return (
    <>
      <fog attach="fog" args={['#f2b88a', 60, 230]} />
      <hemisphereLight args={['#ffd9b0', '#3a5a3a', 1.3]} />
      <directionalLight position={[0, 14, 80]} intensity={1.7} color="#ffd29a" />
      <directionalLight position={[-30, 20, -10]} intensity={0.5} color="#b8c8ff" />
      <ambientLight intensity={0.3} />
      <CameraRig pos={st.camPos} look={st.camLook} frame={frame} />

      {/* terra, areia, mar */}
      <mesh rotation-x={-Math.PI / 2} position={[0, -0.02, -60]}>
        <planeGeometry args={[400, 120]} />
        <meshStandardMaterial color="#4a7a3a" roughness={1} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0, 4]}>
        <planeGeometry args={[400, 16]} />
        <meshStandardMaterial color="#ecd29a" roughness={1} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.005, -10]}>
        <circleGeometry args={[14, 20]} />
        <meshStandardMaterial color="#b8955a" roughness={1} />
      </mesh>
      <Mar frame={frame} />
      <Floresta />
      {[[-13, 0, 0, 0.15], [-9, 0, -2, -0.1], [12, 0, -1, -0.18], [16, 0, 1, 0.12], [-20, 0, 1, 0.08], [24, 0, -2, -0.1]].map((c, k) => (
        <Coqueiro key={k} p={[c[0], c[1], c[2]]} inc={c[3]} />
      ))}

      {/* aldeia e roça */}
      {OCAS.map((p, k) => <Oca key={k} p={p} s={0.9 + (k % 3) * 0.15} v={clamp01(st.aldeia * 1.6 - k * 0.08)} />)}
      {st.roca > 0.01 &&
        Array.from({length: 24}, (_, k) => (
          <mesh key={k} position={[-22 + (k % 6) * 1.4, 0.4 * st.roca, -20 + Math.floor(k / 6) * 1.6]} scale={[st.roca, st.roca, st.roca]}>
            <icosahedronGeometry args={[0.55, 0]} />
            <meshStandardMaterial color="#6fae3a" flatShading />
          </mesh>
        ))}
      {posPessoas.map((p, i) => {
        const v = clamp01(st.pessoas * N_PESSOAS - i) * (i % 3 === 0 ? 1 : clamp01((vivos - (i / N_PESSOAS) * 0.6) * 3));
        return <Indigena key={i} p={p} i={i} v={v} frame={frame} />;
      })}
      <Label text="MILHÕES DE PESSOAS" border="#b3261e" position={[0, 6, -12]} height={1.3} opacity={st.rotulos} />

      {/* invasores */}
      {naviosPos.map((p, k) => <Caravela key={k} p={p} s={k === 0 ? 1.5 : 1.25} frame={frame} fase={k * 1.7} />)}
      <Cruz v={st.cruz} />
      {PORTUGUESES.map((p, k) => <Portugues key={k} p={p} i={k} v={clamp01(st.portugueses * 2.5 - k * 0.3)} frame={frame} />)}
      <Toras v={st.saque} />
    </>
  );
};
