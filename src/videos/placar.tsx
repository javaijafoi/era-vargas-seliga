// Vídeo: "Placar do primeiro contato" — arena de estádio, dois times, um objeto por rodada.
import React from 'react';
import * as THREE from 'three';
import {useCurrentFrame} from 'remotion';
import {Label, rng} from '../components/Kit';
import {CameraRig} from '../core/CameraRig';
import {clamp01, estadoGenerico, mascara} from '../core/mix';
import {Indigena, Portugues} from './chegada';

const CAMERAS: Record<string, {pos: number[]; look: number[]}> = {
  frente: {pos: [0, 5.5, 17], look: [0, 1.6, -2]},
  esquerda: {pos: [-2.6, 3.2, 8.5], look: [-3, 1.8, -2]},
  direita: {pos: [2.6, 3.2, 8.5], look: [3, 1.8, -2]},
  alta: {pos: [0, 16, 13], look: [0, 0, -3]},
  centro: {pos: [0, 4, 13], look: [0, 2.4, -2]},
};
const RODADAS = ['banho', 'figurino', 'negocios', 'presente'];

export const estadoPlacar = (props: any, frame: number) =>
  estadoGenerico(
    props.cenas,
    frame,
    (c) => {
      const cam = CAMERAS[c.camera ?? 'frente'] ?? CAMERAS.frente;
      return {
        camPos: cam.pos, camLook: cam.look,
        times: c.times === false ? 0 : 1,
        rodada: mascara(4, RODADAS.indexOf(c.rodada)),
        luzE: c.vencedor === 'e' ? 1 : 0,
        luzD: c.vencedor === 'd' ? 1 : 0,
        doentes: c.rodada === 'presente' || c.doentes ? 1 : 0,
        caixa: 0,
      };
    },
    {camPos: 40, camLook: 40, rodada: 24, luzE: 20, luzD: 20, doentes: 90},
    (a) => ({...a, times: 0, camPos: [0, 18, 34]}),
  );

const add = {transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false} as const;

// cone de holofote sobre um time
const Holofote: React.FC<{x: number; v: number; cor: string}> = ({x, v, cor}) => {
  if (v <= 0.01) return null;
  return (
    <group position={[x, 0, -1.5]}>
      <mesh position-y={7}>
        <coneGeometry args={[2.2, 14, 24, 1, true]} />
        <meshBasicMaterial color={cor} opacity={0.16 * v} side={THREE.DoubleSide} {...add} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position-y={0.03}>
        <circleGeometry args={[2.2, 32]} />
        <meshBasicMaterial color={cor} opacity={0.35 * v} {...add} />
      </mesh>
    </group>
  );
};

// Rodada 1: banho — rio/cachoeira do lado indígena, moscas no lado português
const Banho: React.FC<{v: number; frame: number}> = ({v, frame}) => {
  if (v <= 0.01) return null;
  const t = frame / 30;
  return (
    <group scale={[v, v, v]}>
      <mesh rotation-x={-Math.PI / 2} position={[3, 0.05, 1]}>
        <circleGeometry args={[1.4, 9]} />
        <meshStandardMaterial color="#3dc6f5" emissive="#1a6a8a" emissiveIntensity={0.5} flatShading />
      </mesh>
      {Array.from({length: 14}, (_, k) => {
        const y = 6 - ((t * 5 + k * 0.43) % 6);
        return (
          <mesh key={k} position={[3 + Math.sin(k * 2.1) * 0.6, y, 1 + Math.cos(k * 1.3) * 0.4]}>
            <octahedronGeometry args={[0.13, 0]} />
            <meshBasicMaterial color="#bff0ff" />
          </mesh>
        );
      })}
      {Array.from({length: 9}, (_, k) => (
        <mesh key={k} position={[-3 + Math.sin(t * 3 + k) * 1.2, 2.6 + Math.sin(t * 5 + k * 2) * 0.7, -1 + Math.cos(t * 4 + k) * 1.4]}>
          <octahedronGeometry args={[0.1, 0]} />
          <meshBasicMaterial color="#1a1a1a" />
        </mesh>
      ))}
      <Label text="3x POR DIA" border="#3dc6f5" position={[2.9, 4, 0]} height={0.55} opacity={v} />
      <Label text="44 DIAS SEM" border="#8a8a8a" position={[-2.9, 4, 0]} height={0.55} opacity={v} />
    </group>
  );
};

// Rodada 2: figurino — sol forte, termômetro
const Figurino: React.FC<{v: number; frame: number}> = ({v, frame}) => {
  if (v <= 0.01) return null;
  const pulso = 1 + Math.sin(frame / 6) * 0.04;
  return (
    <group>
      <mesh position={[0, 7, -6]} scale={[v * pulso, v * pulso, v * pulso]}>
        <icosahedronGeometry args={[1.8, 0]} />
        <meshBasicMaterial color="#ffb400" />
      </mesh>
      <mesh position={[0, 7, -6]} scale={[v, v, v]}>
        <icosahedronGeometry args={[2.8, 1]} />
        <meshBasicMaterial color="#ff7a00" opacity={0.25} {...add} />
      </mesh>
      <Label text="30°C" border="#ff7a00" position={[0, 4.6, -4]} height={0.8} opacity={v} />
      <Label text="VELUDO + ARMADURA" border="#c8201a" position={[-2.6, 3.4, 0]} height={0.45} opacity={v} />
      <Label text="NADA. PERFEITO." border="#3df28f" position={[2.6, 3.4, 0]} height={0.45} opacity={v} />
    </group>
  );
};

// Rodada 3: negócios — espelhinho vai para a direita, tora de pau-brasil vai para a esquerda
const Negocios: React.FC<{v: number; frame: number}> = ({v, frame}) => {
  if (v <= 0.01) return null;
  const t = clamp01(v * 1.4 - 0.2);
  const gira = frame / 12;
  return (
    <group>
      <group position={[-2.5 + 5 * t, 2.6 + Math.sin(t * Math.PI) * 1.5, 1]} rotation-y={gira} scale={[v, v, v]}>
        <mesh>
          <circleGeometry args={[0.55, 8]} />
          <meshStandardMaterial color="#e6f4ff" metalness={1} roughness={0.05} emissive="#9fd8ff" emissiveIntensity={0.6} side={THREE.DoubleSide} />
        </mesh>
        <mesh position-z={-0.02}>
          <ringGeometry args={[0.55, 0.7, 8]} />
          <meshStandardMaterial color="#d4a017" side={THREE.DoubleSide} />
        </mesh>
      </group>
      {Array.from({length: 5}, (_, k) => (
        <mesh key={k} position={[2.5 - 5.5 * t - k * 0.3, 0.35 + (k % 2) * 0.62 + Math.sin(t * Math.PI) * 1.2, 0.4 + (k % 3) * 0.6]} rotation-z={Math.PI / 2} scale={[v, v, v]}>
          <cylinderGeometry args={[0.22, 0.22, 2, 6]} />
          <meshStandardMaterial color="#a02a1a" flatShading />
        </mesh>
      ))}
      <Label text="ESPELHINHO" border="#9fd8ff" position={[1.4, 4.3, 0]} height={0.5} opacity={t} />
      <Label text="PAU-BRASIL" border="#c8201a" position={[-1.4, 3.6, 0]} height={0.5} opacity={t} />
    </group>
  );
};

// Rodada 4: presente — vírus verdes atravessando o campo
const Presente: React.FC<{v: number; frame: number}> = ({v, frame}) => {
  if (v <= 0.01) return null;
  const t = frame / 30;
  const r = rng(5);
  return (
    <group>
      {Array.from({length: 18}, (_, k) => {
        const fase = r() * 6, y = 1 + r() * 2.5, z = -3 + r() * 4;
        const x = -4 + ((t * 1.4 + fase * 1.5) % 8.5);
        return (
          <mesh key={k} position={[x, y + Math.sin(t * 3 + fase) * 0.3, z]} rotation={[t + fase, t * 1.3, 0]} scale={[v, v, v]}>
            <icosahedronGeometry args={[0.2, 0]} />
            <meshStandardMaterial color="#8fff3a" emissive="#4aa010" emissiveIntensity={0.8} flatShading />
          </mesh>
        );
      })}
      <Label text="GRIPE · VARÍOLA · SARAMPO" border="#8fff3a" position={[0, 4.2, -1]} height={0.5} opacity={v} />
    </group>
  );
};

const POS_E: [number, number, number][] = Array.from({length: 7}, (_, k) => [-4.3 + (k % 4) * 0.9 + (k > 3 ? 0.45 : 0), 0, -1 + (k > 3 ? -1.3 : 0)]);
const POS_D: [number, number, number][] = Array.from({length: 9}, (_, k) => [1.5 + (k % 5) * 0.75 + (k > 4 ? 0.4 : 0), 0, -0.8 + (k > 4 ? -1.3 : 0)]);

export const MundoPlacar: React.FC<{props: any}> = ({props}) => {
  const frame = useCurrentFrame();
  const st: any = estadoPlacar(props, frame);
  const tossindo = st.doentes;
  return (
    <>
      <fog attach="fog" args={['#160b2c', 30, 90]} />
      <hemisphereLight args={['#d8c8ff', '#1a3a1a', 1.1]} />
      <directionalLight position={[-14, 20, 14]} intensity={1.4} color="#fff4e0" />
      <directionalLight position={[14, 20, 14]} intensity={1.4} color="#fff4e0" />
      <ambientLight intensity={0.3} />
      <CameraRig pos={st.camPos} look={st.camLook} frame={frame} />

      {/* gramado listrado */}
      {Array.from({length: 12}, (_, k) => (
        <mesh key={k} rotation-x={-Math.PI / 2} position={[-33 + k * 6, 0, -10]}>
          <planeGeometry args={[6, 60]} />
          <meshStandardMaterial color={k % 2 ? '#2f8a3a' : '#28783a'} roughness={1} />
        </mesh>
      ))}
      {/* linha do meio + círculo central */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.02, -2]}>
        <planeGeometry args={[0.18, 40]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.02, -1.5]}>
        <ringGeometry args={[3.2, 3.4, 40]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      {/* arquibancada no fundo */}
      {Array.from({length: 6}, (_, k) => (
        <mesh key={k} position={[0, 1 + k * 1.3, -16 - k * 1.6]}>
          <boxGeometry args={[70, 1.3, 1.6]} />
          <meshStandardMaterial color={['#3b0f5c', '#2a0b44', '#4a1670'][k % 3]} flatShading />
        </mesh>
      ))}
      {/* placas de time no chão */}
      <Label text="PORTUGUESES" border="#c8201a" position={[-2.5, 0.4, 2.4]} height={0.36} opacity={st.times} />
      <Label text="POVOS INDÍGENAS" border="#ffe600" position={[2.5, 0.4, 2.4]} height={0.36} opacity={st.times} />

      <Holofote x={-2.9} v={st.luzE} cor="#ff4d6a" />
      <Holofote x={2.9} v={st.luzD} cor="#ffe600" />

      {POS_E.map((p, k) => <Portugues key={k} p={p} i={k} v={clamp01(st.times * 2 - k * 0.12)} frame={frame} />)}
      {POS_D.map((p, k) => (
        <group key={k} rotation-z={0} position-y={0}>
          <Indigena p={p} i={k + 3} v={clamp01(st.times * 2 - k * 0.1) * (1 - 0.35 * tossindo * (k % 2))} frame={frame} />
        </group>
      ))}

      <Banho v={st.rodada[0]} frame={frame} />
      <Figurino v={st.rodada[1]} frame={frame} />
      <Negocios v={st.rodada[2]} frame={frame} />
      <Presente v={st.rodada[3]} frame={frame} />
    </>
  );
};
