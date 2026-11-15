// Vídeo: qual gráfico usar — colunas (com amplitude), linhas (com maior queda) e setores (ângulo da fatia).
import React from 'react';
import * as THREE from 'three';
import {useCurrentFrame} from 'remotion';
import {Label} from '../components/Kit';
import {AnelArvores, Chao, LinhaNeon, Luzes} from '../core/Ambiente';
import {CameraRig} from '../core/CameraRig';
import {clamp01, estadoGenerico, lerp, mascara} from '../core/mix';

const CAMERAS: Record<string, {pos: number[]; look: number[]}> = {
  frente: {pos: [0, 5, 29], look: [0, 6.2, 0]},
  alto: {pos: [0, 15, 20], look: [0, 5.6, 0]},
  resumo: {pos: [0, 6, 32], look: [0, 9, 0]},
};

export const estadoGraficos = (props: any, frame: number) =>
  estadoGenerico(
    props.cenas,
    frame,
    (c) => {
      const cam = CAMERAS[c.camera ?? 'frente'] ?? CAMERAS.frente;
      return {
        camPos: cam.pos, camLook: cam.look,
        colunas: c.grafico === 'colunas' ? 1 : 0,
        amplitude: c.amplitude ? 1 : 0,
        linha: c.grafico === 'linha' ? 1 : 0,
        desenho: c.grafico === 'linha' || c.resumo ? 1 : 0,
        queda: c.queda ? 1 : 0,
        pizza: c.grafico === 'pizza' ? 1 : 0,
        fatia: mascara(props.pizza.length, c.fatia),
        resumo: c.resumo ? 1 : 0,
        caixa: 0,
      };
    },
    {camPos: 45, camLook: 45, colunas: 30, linha: 30, pizza: 30, desenho: 100, resumo: 45, amplitude: 25, queda: 20, fatia: 25},
    (a) => ({...a, colunas: 0, camPos: [0, 12, 40]}),
  );

// ---------- COLUNAS ----------
const Colunas: React.FC<{dados: any[]; v: number; amp: number}> = ({dados, v, amp}) => {
  const ESP = 1.7;
  const H = 0.55;
  const vals = dados.map((d) => d.valor);
  const iMax = vals.indexOf(Math.max(...vals));
  const iMin = vals.indexOf(Math.min(...vals));
  const xR = ((dados.length - 1) / 2) * ESP + 1.1;
  return (
    <group>
      {dados.map((d, i) => {
        const x = (i - (dados.length - 1) / 2) * ESP;
        const t = clamp01(v * 1.6 - i * 0.12);
        if (t <= 0.01) return null;
        const h = d.valor * H * t;
        const real = i === iMax || i === iMin ? 1 : 1 - 0.6 * amp;
        return (
          <group key={i} position-x={x}>
            <mesh position-y={h / 2}>
              <boxGeometry args={[1.15, h, 1.15]} />
              <meshStandardMaterial color={d.cor} emissive={d.cor} emissiveIntensity={0.18 + 0.3 * real * amp} flatShading transparent opacity={0.35 + 0.65 * real} />
            </mesh>
            <Label text={`${d.valor}`} border={d.cor} position={[0, h + 0.7, 0]} height={0.7} opacity={t} />
            <Label text={d.nome} border="#5a6a85" position={[0, -0.7, 1.2]} height={0.5} opacity={t} />
          </group>
        );
      })}
      {/* amplitude: régua entre o maior e o menor */}
      <LinhaNeon a={[xR, vals[iMin] * H, 0]} b={[xR, vals[iMax] * H, 0]} cor="#ff4d4f" espessura={0.1} opacidade={amp * v} />
      <LinhaNeon a={[(iMax - (dados.length - 1) / 2) * ESP, vals[iMax] * H, 0]} b={[xR, vals[iMax] * H, 0]} cor="#ff4d4f" espessura={0.04} opacidade={amp * v * 0.7} />
      <LinhaNeon a={[(iMin - (dados.length - 1) / 2) * ESP, vals[iMin] * H, 0]} b={[xR, vals[iMin] * H, 0]} cor="#ff4d4f" espessura={0.04} opacidade={amp * v * 0.7} />
    </group>
  );
};

// ---------- LINHA ----------
const Linha: React.FC<{dados: any[]; v: number; desenho: number; queda: number}> = ({dados, v, desenho, queda}) => {
  const ESP = 1.55;
  const base = dados[0].base ?? 20;
  const pts = dados.map((d, i) => [(i - (dados.length - 1) / 2) * ESP, (d.valor - base) * 0.62 + 0.4, 0]);
  const nSeg = pts.length - 1;
  const prog = desenho * nSeg;
  // maior queda
  let iQ = 0, maxQ = 0;
  for (let i = 0; i < nSeg; i++) if (dados[i].valor - dados[i + 1].valor > maxQ) (maxQ = dados[i].valor - dados[i + 1].valor), (iQ = i);
  if (v <= 0.01) return null;
  return (
    <group scale={[1, v, 1]}>
      {/* eixos */}
      <LinhaNeon a={[pts[0][0] - 0.8, 0, -0.3]} b={[pts[nSeg][0] + 0.8, 0, -0.3]} cor="#8fa3c0" espessura={0.05} />
      {pts.map((p, i) => (
        <Label key={`d${i}`} text={dados[i].nome} border="#5a6a85" position={[p[0], -0.6, 0.8]} height={0.45} opacity={v} />
      ))}
      {pts.slice(0, -1).map((p, i) => {
        const t = clamp01(prog - i);
        if (t <= 0) return null;
        const q = pts[i + 1];
        const fim = [lerp(p[0], q[0], t), lerp(p[1], q[1], t), 0];
        const cor = i === iQ ? (queda > 0.5 ? '#ff4d4f' : '#3dd6f5') : '#3dd6f5';
        return <LinhaNeon key={i} a={p} b={fim} cor={cor} espessura={i === iQ ? 0.1 + 0.08 * queda : 0.1} />;
      })}
      {pts.map((p, i) => {
        const vis = clamp01(prog - i + 1);
        return (
          <group key={i}>
            <mesh position={p as any} scale={vis}>
              <icosahedronGeometry args={[0.2, 0]} />
              <meshBasicMaterial color="#e8f4ff" fog={false} />
            </mesh>
            <Label text={`${dados[i].valor}°`} border={(i === iQ || i === iQ + 1) && queda > 0.5 ? '#ff4d4f' : '#3dd6f5'} position={[p[0], p[1] + 0.75, 0]} height={0.5} opacity={vis} />
          </group>
        );
      })}
      <Label text={`queda de ${maxQ}°`} border="#ff4d4f" position={[(pts[iQ][0] + pts[iQ + 1][0]) / 2 + 1.4, (pts[iQ][1] + pts[iQ + 1][1]) / 2 - 0.4, 0.5]} height={0.6} opacity={queda} />
    </group>
  );
};

// ---------- PIZZA (setores) ----------
const Pizza: React.FC<{dados: any[]; v: number; fatia: number[]}> = ({dados, v, fatia}) => {
  if (v <= 0.01) return null;
  const total = dados.reduce((a, d) => a + d.valor, 0);
  let ang = Math.PI / 2;
  return (
    <group scale={v} rotation-y={(1 - v) * 1.5}>
      {dados.map((d, i) => {
        const len = (d.valor / total) * Math.PI * 2;
        const start = ang;
        ang += len;
        const mid = start + len / 2;
        const exp = 0.15 + 0.9 * fatia[i];
        // em cylinderGeometry, theta é medido a partir do eixo +z indo para +x
        const dx = Math.sin(mid) * exp, dz = Math.cos(mid) * exp;
        const r = 3.6;
        return (
          <group key={i} position={[dx, 0.5 * fatia[i], dz]}>
            <mesh position-y={0.45}>
              <cylinderGeometry args={[r, r, 0.9, 40, 1, false, start, len]} />
              <meshStandardMaterial color={d.cor} emissive={d.cor} emissiveIntensity={0.15 + 0.35 * fatia[i]} flatShading />
            </mesh>
            <Label
              text={`${d.nome} ${Math.round((d.valor / total) * 100)}%`}
              border={d.cor}
              position={[Math.sin(mid) * r * 0.62, 1.5, Math.cos(mid) * r * 0.62]}
              height={0.5}
            />
            <Label text={`${Math.round((d.valor / total) * 360)}°`} border="#3df28f" position={[Math.sin(mid) * r * 0.62, 2.4, Math.cos(mid) * r * 0.62]} height={0.7} opacity={fatia[i]} />
          </group>
        );
      })}
    </group>
  );
};

export const MundoGraficos: React.FC<{props: any}> = ({props}) => {
  const frame = useCurrentFrame();
  const st: any = estadoGraficos(props, frame);
  const R = st.resumo;
  const esc = lerp(1, 0.46, R);
  const vis = (k: number) => Math.max(k, R);
  return (
    <>
      <Luzes />
      <CameraRig pos={st.camPos} look={st.camLook} frame={frame} />
      <Chao />
      <AnelArvores livreX={22} livreZ={-24} />
      <group position={[0, lerp(0, 9.4, R), 0]} scale={esc}>
        <Colunas dados={props.colunas} v={vis(st.colunas)} amp={st.amplitude * (1 - R)} />
      </group>
      <group position={[0, lerp(0, 4.6, R), 0]} scale={esc}>
        <Linha dados={props.linha} v={vis(st.linha)} desenho={Math.max(st.desenho, R)} queda={st.queda * (1 - R)} />
      </group>
      <group position={[0, lerp(4.6, 1.2, R), 0]} rotation-x={lerp(0.5, 0.7, R)} scale={esc}>
        <Pizza dados={props.pizza} v={vis(st.pizza)} fatia={st.fatia.map((f: number) => f * (1 - R))} />
      </group>
    </>
  );
};

export {THREE};
