import * as THREE from 'three';

const cache = new Map<string, THREE.CanvasTexture>();

// Etiqueta arredondada com borda neon, desenhada num canvas e usada como textura de sprite.
export const labelTexture = (text: string, border: string, color = '#ffffff') => {
  const key = `${text}|${border}|${color}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const font = '800 92px Montserrat';
  const c = document.createElement('canvas');
  const ctx = c.getContext('2d')!;
  ctx.font = font;
  const w = Math.ceil(ctx.measureText(text).width) + 110;
  const h = 150;
  c.width = w + 40;
  c.height = h + 40;
  ctx.font = font;
  const x = 20, y = 20, r = 38;
  ctx.shadowColor = border;
  ctx.shadowBlur = 18;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fillStyle = 'rgba(8,14,18,0.86)';
  ctx.fill();
  ctx.lineWidth = 7;
  ctx.strokeStyle = border;
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x + w / 2, y + h / 2 + 4);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  (tex as any).userData = {aspect: c.width / c.height};
  cache.set(key, tex);
  return tex;
};

// Gradiente radial (brilho) reutilizável para lanternas e reflexos.
let glow: THREE.CanvasTexture | null = null;
export const glowTexture = () => {
  if (glow) return glow;
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const ctx = c.getContext('2d')!;
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.25, 'rgba(255,255,255,0.55)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  glow = new THREE.CanvasTexture(c);
  return glow;
};

// Feixe de luz: claro no centro, some nas bordas e na ponta distante.
let beam: THREE.CanvasTexture | null = null;
export const beamTexture = () => {
  if (beam) return beam;
  const c = document.createElement('canvas');
  c.width = 64;
  c.height = 512;
  const ctx = c.getContext('2d')!;
  for (let x = 0; x < 64; x++) {
    const d = Math.abs(x - 31.5) / 32;
    const a = Math.pow(1 - d, 2.2);
    const g = ctx.createLinearGradient(0, 0, 0, 512);
    g.addColorStop(0, `rgba(255,255,255,0)`);
    g.addColorStop(0.25, `rgba(235,245,255,${a * 0.9})`);
    g.addColorStop(1, `rgba(255,255,255,${a})`);
    ctx.fillStyle = g;
    ctx.fillRect(x, 0, 1, 512);
  }
  beam = new THREE.CanvasTexture(c);
  return beam;
};
