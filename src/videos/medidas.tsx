// Vídeo: média, mediana e moda com colunas neon.
import React from 'react';
import {useCurrentFrame} from 'remotion';
import {Label} from '../components/Kit';
import {AnelArvores, Chao, Coluna, LinhaNeon, Luzes} from '../core/Ambiente';
import {CameraRig} from '../core/CameraRig';
import {estadoGenerico, lerp, mascara} from '../core/mix';

const CAMERAS: Record<string, {pos: number[]; look: number[]}> = {
  frente: {pos: [0, 6.5, 33], look: [0, 7.6, -4]},
  perto: {pos: [0, 4.5, 30], look: [0, 6.4, -4]},
  longe: {pos: [0, 12, 47], look: [0, 13.2, -4]},
  baixa: {pos: [0, 2.5, 30], look: [0, 7, -4]},
};
const ESP = 1.3;
const COR = '#3dd6f5';
const altura = (v: number) => 0.25 + v * 0.12;
const fmt = (x: number) => x.toLocaleString('pt-BR', {maximumFractionDigits: 1});

export const estadoMedidas = (props: any, frame: number) => {
  const n = props.dados.length;
  return estadoGenerico(
    props.cenas,
    frame,
    (c) => {
      const cam = CAMERAS[c.camera ?? 'frente'] ?? CAMERAS.frente;
      return {
        camPos: cam.pos, camLook: cam.look,
        aparecer: c.aparecer === false ? 0 : 1,
        ordenado: c.ordenado ? 1 : 0,
        destaque: mascara(n, c.acender),
        algumDestaque: c.acender != null ? 1 : 0,
        remover: mascara(n, c.remover),
        nivelar: c.nivelar ? 1 : 0,
        linhaMedia: c.linhaMedia ? 1 : 0,
        outlier: c.outlier ? 1 : 0,
        caixa: c.caixa ? 1 : 0,
      };
    },
    {camPos: 40, camLook: 40, aparecer: 40, ordenado: 50, nivelar: 45, outlier: 50, remover: 30, destaque: 14, algumDestaque: 14},
    (a) => ({...a, aparecer: 0, camPos: [0, 10, 46]}),
  );
};

export const MundoMedidas: React.FC<{props: any}> = ({props}) => {
  const frame = useCurrentFrame();
  const st: any = estadoMedidas(props, frame);
  const dados: number[] = props.dados;
  const n = dados.length;
  const ordem = dados.map((v, i) => ({v, i})).sort((a, b) => a.v - b.v || a.i - b.i);
  const rank = Array(n);
  ordem.forEach((o, r) => (rank[o.i] = r));
  // ranks ignorando os removidos (para o caso "quantidade par")
  const removidos = new Set((props.cenas.find((c: any) => c.remover)?.remover ?? []) as number[]);
  const ordemR = ordem.filter((o) => !removidos.has(o.i));
  const rankR = Array(n).fill(-1);
  ordemR.forEach((o, r) => (rankR[o.i] = r));
  const remocao = Math.max(...st.remover);

  const valores = dados.map((v, i) => (i === props.outlier?.indice ? lerp(v, props.outlier.valor, st.outlier) : v));
  const peso = valores.map((_, i) => 1 - st.remover[i]);
  const somaPeso = peso.reduce((a, b) => a + b, 0);
  const media = valores.reduce((a, v, i) => a + v * peso[i], 0) / somaPeso;
  const hMedia = altura(media);

  return (
    <>
      <Luzes />
      <CameraRig pos={st.camPos} look={st.camLook} frame={frame} />
      <Chao />
      <AnelArvores livreX={22} livreZ={-24} />
      {dados.map((v, i) => {
        const xOrig = (i - (n - 1) / 2) * ESP;
        const xSort = (rank[i] - (n - 1) / 2) * ESP;
        const xSortR = rankR[i] >= 0 ? (rankR[i] - (ordemR.length - 1) / 2) * ESP : xSort;
        const x = lerp(xOrig, lerp(xSort, xSortR, remocao), st.ordenado);
        const z = Math.sin(Math.PI * st.ordenado) * (i % 2 ? 1.8 : -1.8);
        const hReal = altura(valores[i]);
        const h = lerp(hReal, hMedia, st.nivelar) * st.aparecer * (1 - st.remover[i]);
        const d = st.destaque[i];
        const dim = 1 - 0.55 * st.algumDestaque * (1 - d);
        const cor = d > 0.5 ? props.cenas[st._cena].corColuna ?? '#3df28f' : COR;
        return (
          <group key={i}>
            <Coluna position={[x, 0, z]} raio={0.46} h={h} cor={cor} brilho={0.5 + 0.5 * d} opacidade={dim * (1 - st.remover[i])} />
            <Label
              text={fmt(Math.round(valores[i]))}
              border={cor}
              position={[x, Math.min(h, 17) + 0.75, z]}
              height={0.8 + 0.25 * d}
              opacity={st.aparecer * (1 - st.remover[i]) * (0.45 + 0.55 * dim) * (1 - 0.6 * st.nivelar)}
            />
          </group>
        );
      })}
      <LinhaNeon a={[-6.6, hMedia, 0]} b={[6.6, hMedia, 0]} cor="#3df28f" opacidade={st.linhaMedia} />
      <Label text={`média ≈ ${fmt(media)}`} border="#3df28f" position={[0, hMedia + 1.0, 1.5]} height={0.85} opacity={st.linhaMedia} />
    </>
  );
};
