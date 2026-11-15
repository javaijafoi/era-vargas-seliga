// Vídeo: pesquisa censitária x amostral e tipos de variável, com uma "cidadezinha" de bonequinhos low poly.
import React, {useMemo} from 'react';
import * as THREE from 'three';
import {useCurrentFrame} from 'remotion';
import {Label, rng} from '../components/Kit';
import {AnelArvores, Chao, Luzes} from '../core/Ambiente';
import {CameraRig} from '../core/CameraRig';
import {clamp01, estadoGenerico, lerp, mascara} from '../core/mix';

const COLS = 7, ROWS = 8, ESP = 1.55;
const Z0 = 2.5; // fileira da frente
const ALVO = 3 + 0 * COLS; // pessoa em destaque (frente, centro)
const posDe = (i: number) => {
  const c = i % COLS, r = Math.floor(i / COLS);
  const j = rng(i + 11);
  return [(c - (COLS - 1) / 2) * ESP + (j() - 0.5) * 0.5, 0, Z0 - r * ESP + (j() - 0.5) * 0.5] as [number, number, number];
};
const PA = posDe(ALVO);

const CAMERAS: Record<string, {pos: number[]; look: number[]}> = {
  geral: {pos: [0, 15, 22], look: [0, 4.6, -6]},
  baixa: {pos: [6, 5, 17], look: [0, 3.4, -5]},
  perto: {pos: [PA[0] + 2.4, 2.6, PA[2] + 9.5], look: [PA[0] + 1.5, 2.3, PA[2]]},
};

export const estadoPesquisa = (props: any, frame: number) => {
  const N = COLS * ROWS;
  return estadoGenerico(
    props.cenas,
    frame,
    (c) => {
      const cam = CAMERAS[c.camera ?? 'geral'] ?? CAMERAS.geral;
      return {
        camPos: cam.pos, camLook: cam.look,
        scanner: c.censo ? 1 : 0,
        censo: c.censo ? 1 : 0,
        amostra: c.amostra ? 1 : 0,
        foco: c.foco ? 1 : 0,
        rotulos: mascara(4, c.rotulos),
        caixa: 0,
        _n: N,
      };
    },
    {camPos: 45, camLook: 45, scanner: 110, censo: 20, amostra: 25, rotulos: 16},
    (a) => ({...a, camPos: [0, 22, 34]}),
  );
};

const PELE = ['#f1c7a3', '#d9a27a', '#b07850', '#8a5a3c', '#5e3b26'];
const CAMISA = ['#3dd6f5', '#e8641e', '#e9b21a', '#d9262c', '#1f9e6a', '#c062ff', '#f2f2f2', '#2f6fdf'];
const CABELO = ['#1b1410', '#3a2618', '#6b4423', '#c9a15a', '#222222'];

const Pessoa: React.FC<{p: [number, number, number]; i: number; dim: number; verde: number; frame: number; escala?: number}> = ({p, i, dim, verde, frame, escala = 1}) => {
  const r = useMemo(() => rng(i * 7 + 3), [i]);
  const look = useMemo(() => {
    const k = rng(i * 7 + 3);
    return {
      pele: PELE[Math.floor(k() * PELE.length)], camisa: CAMISA[Math.floor(k() * CAMISA.length)],
      cabelo: CABELO[Math.floor(k() * CABELO.length)], s: 0.85 + k() * 0.3, fase: k() * 6,
    };
  }, [i, r]);
  const bob = Math.abs(Math.sin(frame / 9 + look.fase)) * 0.04;
  const fator = 1 - 0.82 * dim;
  const c = (hex: string) => new THREE.Color(hex).multiplyScalar(fator).lerp(new THREE.Color('#3df28f'), 0.35 * verde);
  return (
    <group position={[p[0], bob, p[2]]} scale={look.s * escala}>
      <mesh position-y={0.55}>
        <cylinderGeometry args={[0.18, 0.2, 1.1, 6]} />
        <meshStandardMaterial color={c('#2a2f3a')} flatShading />
      </mesh>
      <mesh position-y={1.35}>
        <cylinderGeometry args={[0.26, 0.3, 0.75, 6]} />
        <meshStandardMaterial color={c(look.camisa)} flatShading />
      </mesh>
      <mesh position-y={2.0}>
        <icosahedronGeometry args={[0.27, 0]} />
        <meshStandardMaterial color={c(look.pele)} flatShading />
      </mesh>
      <mesh position={[0, 2.12, -0.04]} scale={[1.05, 0.7, 1.05]}>
        <icosahedronGeometry args={[0.28, 0]} />
        <meshStandardMaterial color={c(look.cabelo)} flatShading />
      </mesh>
    </group>
  );
};

const Anel: React.FC<{p: number[]; cor: string; op: number; r?: number}> = ({p, cor, op, r = 0.55}) =>
  op <= 0.01 ? null : (
    <mesh position={[p[0], 0.05, p[2]]} rotation-x={-Math.PI / 2}>
      <ringGeometry args={[r * 0.8, r, 24]} />
      <meshBasicMaterial color={cor} transparent opacity={op} fog={false} />
    </mesh>
  );

const Holofote: React.FC<{p: number[]; op: number}> = ({p, op}) =>
  op <= 0.01 ? null : (
    <mesh position={[p[0], 4, p[2]]}>
      <coneGeometry args={[0.9, 8, 20, 1, true]} />
      <meshBasicMaterial color="#fff2b0" transparent opacity={0.16 * op} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} fog={false} />
    </mesh>
  );

export const MundoPesquisa: React.FC<{props: any}> = ({props}) => {
  const frame = useCurrentFrame();
  const st: any = estadoPesquisa(props, frame);
  const N = COLS * ROWS;
  const amostra: number[] = props.amostra;
  const zFrente = Z0 + 1.5, zFundo = Z0 - ROWS * ESP;
  const zScan = lerp(zFundo, zFrente, st.scanner);
  const rot = props.rotulos as {texto: string; cor: string}[];

  return (
    <>
      <Luzes />
      <CameraRig pos={st.camPos} look={st.camLook} frame={frame} drift={1 - 0.8 * st.foco} />
      <Chao />
      <AnelArvores livreX={20} livreZ={-24} />
      {Array.from({length: N}, (_, i) => {
        const p = posDe(i);
        const escaneado = st.censo * (p[2] < zScan ? 1 : 0);
        const naAmostra = amostra.includes(i) ? 1 : 0;
        const dim = Math.max(st.amostra * (1 - naAmostra), st.foco * (i === ALVO ? 0 : 1));
        return (
          <group key={i}>
            <Pessoa
              p={p} i={i} dim={dim} verde={escaneado} frame={frame}
              escala={i === ALVO ? 1 + 0.2 * st.foco : p[2] > PA[2] - 2.6 ? 1 - st.foco : 1}
            />
            <Anel p={p} cor="#3df28f" op={escaneado} />
            <Anel p={p} cor="#ffd23f" op={st.amostra * naAmostra} r={0.75} />
            <Holofote p={p} op={st.amostra * naAmostra} />
            {i === ALVO && <Anel p={p} cor="#3dd6f5" op={st.foco} r={0.7} />}
          </group>
        );
      })}
      {/* scanner do censo */}
      {st.censo > 0.01 && st.scanner < 0.999 && (
        <group position={[0, 1.2, zScan]}>
          <mesh>
            <boxGeometry args={[COLS * ESP + 2, 2.6, 0.05]} />
            <meshBasicMaterial color="#3df28f" transparent opacity={0.18 * st.censo} blending={THREE.AdditiveBlending} depthWrite={false} fog={false} />
          </mesh>
          <mesh position-y={-1.25}>
            <boxGeometry args={[COLS * ESP + 2, 0.06, 0.12]} />
            <meshBasicMaterial color="#3df28f" fog={false} />
          </mesh>
        </group>
      )}
      {/* etiquetas das variáveis ao lado da pessoa em destaque */}
      {rot.map((r, k) => (
        <Label
          key={k}
          text={r.texto}
          border={r.cor}
          esquerda
          position={[PA[0] + 0.45 + (1 - clamp01(st.rotulos[k])) * 0.6, 2.75 - k * 0.52, PA[2] + 0.3]}
          height={0.42}
          opacity={st.rotulos[k] * st.foco}
        />
      ))}
    </>
  );
};
