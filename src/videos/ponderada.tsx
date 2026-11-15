// Vídeo: média ponderada como gangorra (régua 0–10 sobre um apoio, notas como pilhas de blocos).
import React from 'react';
import * as THREE from 'three';
import {useCurrentFrame} from 'remotion';
import {Label} from '../components/Kit';
import {AnelArvores, Chao, LinhaNeon, Luzes} from '../core/Ambiente';
import {CameraRig} from '../core/CameraRig';
import {clamp01, estadoGenerico, mascara} from '../core/mix';

const CAMERAS: Record<string, {pos: number[]; look: number[]}> = {
  frente: {pos: [0, 6.5, 31], look: [0, 7.4, -2]},
  lado: {pos: [10, 8, 27], look: [0.5, 6.8, -2]},
  perto: {pos: [1.5, 5.5, 26], look: [1.2, 6.8, -2]},
};
const S = 1.05; // unidades por ponto da nota
const Y = 3.2; // altura do apoio
const xN = (n: number) => (n - 5) * S;
const fmt = (x: number) => x.toLocaleString('pt-BR', {maximumFractionDigits: 2});

export const estadoPonderada = (props: any, frame: number) => {
  const n = props.notas.length;
  return estadoGenerico(
    props.cenas,
    frame,
    (c) => {
      const cam = CAMERAS[c.camera ?? 'frente'] ?? CAMERAS.frente;
      return {
        camPos: cam.pos, camLook: cam.look,
        regua: c.regua === false ? 0 : 1,
        pilhas: mascara(n, c.pilhas),
        apoio: c.apoio ?? 5,
        rotuloApoio: c.rotuloApoio ? 1 : 0,
        simples: c.simples ? 1 : 0,
        caixa: 0,
      };
    },
    {camPos: 40, camLook: 40, pilhas: 40, apoio: 75, regua: 30},
    (a) => ({...a, regua: 0, camPos: [0, 12, 44]}),
  );
};

const Bloco: React.FC<{pos: [number, number, number]; cor: string; op: number}> = ({pos, cor, op}) => (
  <mesh position={pos}>
    <boxGeometry args={[0.82, 0.78, 0.82]} />
    <meshStandardMaterial color={cor} emissive={cor} emissiveIntensity={0.25} flatShading transparent opacity={op} />
  </mesh>
);

export const MundoPonderada: React.FC<{props: any}> = ({props}) => {
  const frame = useCurrentFrame();
  const st: any = estadoPonderada(props, frame);
  const notas = props.notas;
  const p = st.apoio;
  const torque = notas.reduce((a: number, nt: any, i: number) => a + nt.peso * st.pilhas[i] * (nt.nota - p), 0);
  const theta = -Math.max(-0.28, Math.min(0.28, torque * 0.02)) * st.regua;
  const xp = xN(p);
  const simplesV = notas.reduce((a: number, nt: any) => a + nt.nota, 0) / notas.length;

  return (
    <>
      <Luzes />
      <CameraRig pos={st.camPos} look={st.camLook} frame={frame} />
      <Chao />
      <AnelArvores livreX={22} livreZ={-24} />

      {/* apoio (prisma triangular) */}
      <mesh position={[xp, (Y - 0.15) / 2, 0]} scale={[1, 1, 1]} rotation-y={Math.PI / 6}>
        <coneGeometry args={[1.1, Y - 0.15, 3]} />
        <meshStandardMaterial color="#c9d2e3" flatShading />
      </mesh>
      <Label text={fmt(Math.round(p * 100) / 100)} border="#3df28f" position={[xp, 0.9, 1.6]} height={0.95} opacity={st.rotuloApoio} />

      {/* régua girando em torno do apoio */}
      <group position={[xp, Y, 0]} rotation-z={theta} scale={[st.regua, st.regua, st.regua]}>
        <group position-x={-xp}>
          <mesh position={[0, 0.12, 0]}>
            <boxGeometry args={[10 * S + 1.4, 0.24, 1.3]} />
            <meshStandardMaterial color="#8b5a2b" flatShading />
          </mesh>
          {Array.from({length: 11}, (_, k) => (
            <group key={k} position-x={xN(k)}>
              <mesh position={[0, 0.25, 0.66]}>
                <boxGeometry args={[0.06, 0.02, 0.3]} />
                <meshBasicMaterial color="#ffffff" />
              </mesh>
              <Label text={`${k}`} border="#3dd6f5" position={[0, -0.55, 0.7]} height={0.5} />
            </group>
          ))}
          {notas.map((nt: any, i: number) => {
            const v = st.pilhas[i];
            if (v <= 0.01) return null;
            return (
              <group key={i} position-x={xN(nt.nota)}>
                {Array.from({length: nt.peso}, (_, k) => {
                  const t = clamp01(v * (nt.peso + 1) - k);
                  return <Bloco key={k} pos={[0, 0.65 + k * 0.9 + (1 - t) * 5, 0]} cor={nt.cor} op={t} />;
                })}
                <Label
                  text={`${nt.nome} ×${nt.peso}`}
                  border={nt.cor}
                  position={[Math.min(0, 3.9 - xN(nt.nota)), 0.65 + nt.peso * 0.9 + 0.5 + (i % 2) * 0.9, 0]}
                  height={0.58}
                  opacity={clamp01(v * 2 - 1)}
                />
              </group>
            );
          })}
        </group>
      </group>

      {/* média simples, para comparar */}
      <LinhaNeon a={[xN(simplesV), 0.05, 0.9]} b={[xN(simplesV), Y + 0.6, 0.9]} cor="#ff9f1c" opacidade={st.simples} />
      <Label text={`simples ${fmt(simplesV)}`} border="#ff9f1c" position={[xN(simplesV) + 1.2, 1.6, 1.6]} height={0.75} opacity={st.simples} />
    </>
  );
};

export {THREE};
