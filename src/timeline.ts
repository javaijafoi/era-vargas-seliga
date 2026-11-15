// Converte o roteiro (lista de cenas) em um "estado" contínuo do mundo 3D por frame.
// Cada cena declara um estado-alvo; entre cenas os valores são interpolados suavemente.

export const LANES = [-4.5, -1.5, 1.5, 4.5];
type V3 = [number, number, number];

export const CAMERAS: Record<string, {pos: V3; look: V3}> = {
  atras: {pos: [0, 8.2, 33], look: [0, 1.2, -30]},
  baixa: {pos: [0, 4.6, 30], look: [0, 3.2, -40]},
  alta: {pos: [0, 28, 30], look: [0, 0, -16]},
  lateral: {pos: [7.5, 7.5, 29], look: [-1.8, 1.8, -16]},
};

export type Estado = {
  camPos: V3;
  camLook: V3;
  barras: number[];
  foco: number[];
  feixe: number;
  caixa: number;
  corrida: number;
  velocidades: number;
};

const alvo = (cena: any, nCarros: number): Estado => {
  const cam = CAMERAS[cena.camera ?? 'atras'] ?? CAMERAS.atras;
  const focoX = cena.foco != null && cena.camera !== 'lateral' ? LANES[cena.foco] * 0.35 : 0;
  return {
    camPos: [cam.pos[0] + focoX, cam.pos[1], cam.pos[2]],
    camLook: [cam.look[0] + focoX * 1.4, cam.look[1], cam.look[2]],
    barras: Array.from({length: nCarros}, (_, i) => ((cena.barras ?? []).includes(i) ? 1 : 0)),
    foco: Array.from({length: nCarros}, (_, i) => (cena.foco === i ? 1 : 0)),
    feixe: cena.feixe ? 1 : 0,
    caixa: cena.caixa ? 1 : 0,
    corrida: cena.corrida ? 1 : 0,
    velocidades: cena.velocidades ? 1 : 0,
  };
};

const ease = (t: number) => {
  const x = Math.min(1, Math.max(0, t));
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
};
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// quantos frames cada propriedade leva para transicionar
const TRANS: Record<keyof Estado, number> = {
  camPos: 36, camLook: 36, barras: 22, foco: 14, feixe: 40, caixa: 14, corrida: 75, velocidades: 14,
};

export const cenaNoFrame = (cenas: any[], frame: number) => {
  let start = 0;
  for (let i = 0; i < cenas.length; i++) {
    if (frame < start + cenas[i].frames || i === cenas.length - 1) return {i, start, local: frame - start};
    start += cenas[i].frames;
  }
  return {i: 0, start: 0, local: frame};
};

export const estadoNoFrame = (cenas: any[], nCarros: number, frame: number): Estado => {
  const {i, local} = cenaNoFrame(cenas, frame);
  const atual = alvo(cenas[i], nCarros);
  if (i === 0) {
    // abertura: câmera chega de mais longe
    const ini = {...atual, camPos: [0, 7, 30] as V3, barras: atual.barras.map(() => 0)};
    return mix(ini, atual, local);
  }
  // estado anterior = alvo da cena anterior, já que a transição dela terminou (ou quase)
  const anterior = estadoNoFrame(cenas, nCarros, frameFimCena(cenas, i - 1));
  return mix(anterior, atual, local);
};

const frameFimCena = (cenas: any[], i: number) => cenas.slice(0, i + 1).reduce((a, c) => a + c.frames, 0) - 1;

const mix = (a: Estado, b: Estado, local: number): Estado => {
  const out: any = {};
  for (const k of Object.keys(b) as (keyof Estado)[]) {
    const t = ease(local / TRANS[k]);
    const va: any = a[k];
    const vb: any = b[k];
    out[k] = Array.isArray(vb) ? vb.map((v: number, j: number) => lerp(va[j], v, t)) : lerp(va, vb, t);
  }
  return out;
};
