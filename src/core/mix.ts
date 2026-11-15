// Timeline genérica: cada cena define um "alvo" (objeto plano de números ou listas de números).
// Entre cenas, cada chave é interpolada com easing. Serve para qualquer tipo de vídeo.
export type Alvo = Record<string, number | number[]>;

const ease = (t: number) => {
  const x = Math.min(1, Math.max(0, t));
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
};
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

export const cenaNoFrame = (cenas: any[], frame: number) => {
  let start = 0;
  for (let i = 0; i < cenas.length; i++) {
    if (frame < start + cenas[i].frames || i === cenas.length - 1) return {i, start, local: frame - start};
    start += cenas[i].frames;
  }
  return {i: 0, start: 0, local: frame};
};

const mix = (a: Alvo, b: Alvo, local: number, trans: Record<string, number>): Alvo => {
  const out: Alvo = {};
  for (const k of Object.keys(b)) {
    const t = ease(local / (trans[k] ?? 30));
    const va = a[k] ?? b[k];
    const vb = b[k];
    out[k] = Array.isArray(vb)
      ? vb.map((v, j) => lerp(((va as number[])[j] ?? v) as number, v, t))
      : lerp(va as number, vb as number, t);
  }
  return out;
};

export const estadoGenerico = (
  cenas: any[],
  frame: number,
  alvo: (cena: any, i: number) => Alvo,
  trans: Record<string, number>,
  inicial?: (a: Alvo) => Alvo,
): Alvo & {_cena: number; _local: number} => {
  const {i, local} = cenaNoFrame(cenas, frame);
  const atual = alvo(cenas[i], i);
  let anterior: Alvo;
  if (i === 0) anterior = inicial ? inicial(atual) : atual;
  else {
    const fimAnterior = cenas.slice(0, i).reduce((a: number, c: any) => a + c.frames, 0) - 1;
    anterior = estadoGenerico(cenas, fimAnterior, alvo, trans, inicial);
  }
  return {...mix(anterior, atual, local, trans), _cena: i, _local: local} as any;
};

// lista de índices -> máscara 0/1
export const mascara = (n: number, idx: number[] | number | undefined | null) => {
  const arr = idx == null ? [] : Array.isArray(idx) ? idx : [idx];
  return Array.from({length: n}, (_, i) => (arr.includes(i) ? 1 : 0));
};
