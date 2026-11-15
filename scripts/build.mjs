// Pipeline: roteiro JSON -> narração (TTS) -> props com durações -> render MP4
// Uso: node scripts/build.mjs roteiros/velocidade-300km.json [--sem-voz] [--sem-render] [--frames=0-90]
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync, spawnSync} from 'node:child_process';

const FPS = 30;
const args = process.argv.slice(2);
const roteiroPath = args.find((a) => !a.startsWith('--')) ?? 'roteiros/velocidade-300km.json';
const semVoz = args.includes('--sem-voz');
const semRender = args.includes('--sem-render');
const framesArg = args.find((a) => a.startsWith('--frames='));

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function resolveBinary(envVar, name, winFallbacks = []) {
  const fromEnv = process.env[envVar];
  if (fromEnv && fs.existsSync(fromEnv)) return fromEnv;
  const check = spawnSync(name, ['-version'], {stdio: 'ignore'});
  if (!check.error && check.status === 0) return name;
  if (process.platform === 'win32') {
    for (const candidate of winFallbacks) {
      if (fs.existsSync(candidate)) return candidate;
    }
  }
  return name;
}

function resolvePython() {
  const candidates = [
    process.env.PYTHON,
    path.join(root, '.venv', 'Scripts', 'python.exe'),
    path.join(root, '.venv', 'bin', 'python'),
  ].filter(Boolean);
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }
  return process.platform === 'win32' ? 'python' : 'python3';
}

const FFMPEG = resolveBinary('FFMPEG_PATH', 'ffmpeg', [
  'C:\\Program Files\\Krita (x64)\\bin\\ffmpeg.exe',
]);
const FFPROBE = resolveBinary('FFPROBE_PATH', 'ffprobe', [
  'C:\\Program Files\\Krita (x64)\\bin\\ffprobe.exe',
]);
const PYTHON = resolvePython();
const roteiro = JSON.parse(fs.readFileSync(path.resolve(roteiroPath), 'utf8'));
const nome = path.basename(roteiroPath, '.json');

// ---------- tempos de viagem calculados (nada de conta errada no texto) ----------
const tempos = (roteiro.carros ?? []).map((c) => {
  const min = Math.round((roteiro.distanciaKm / c.velocidade) * 60);
  return {horas: min / 60, label: `${Math.floor(min / 60)}h${String(min % 60).padStart(2, '0')}`};
});
const preencher = (s) => s.replace(/\{tempo(\d)\}/g, (_, i) => tempos[+i].label.toUpperCase());

// ---------- TTS ----------
// Provedor: ElevenLabs se ELEVENLABS_API_KEY existir; senão Kokoro local (voices/kokoro); senão Piper.
const audioDir = path.join(root, 'public', 'audio', nome);
fs.mkdirSync(audioDir, {recursive: true});

const duracaoAudio = (f) =>
  parseFloat(execFileSync(FFPROBE, ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]).toString());

async function ttsElevenLabs(texto, out) {
  const voice = process.env.ELEVENLABS_VOICE_ID ?? 'pNInz6obpgDQGcFmaJgB';
  const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice}/with-timestamps`, {
    method: 'POST',
    headers: {'xi-api-key': process.env.ELEVENLABS_API_KEY, 'content-type': 'application/json'},
    body: JSON.stringify({text: texto, model_id: 'eleven_multilingual_v2'}),
  });
  if (!r.ok) throw new Error(`ElevenLabs ${r.status}: ${await r.text()}`);
  const j = await r.json();
  const mp3 = out.replace(/\.wav$/, '.mp3');
  fs.writeFileSync(mp3, Buffer.from(j.audio_base64, 'base64'));
  execFileSync(FFMPEG, ['-y', '-loglevel', 'error', '-i', mp3, out]);
  fs.writeFileSync(out.replace(/\.wav$/, '.timestamps.json'), JSON.stringify(j.alignment));
}

function ttsPiper(texto, out) {
  const model = process.env.PIPER_VOICE ?? path.join(root, 'voices', 'pt-br-edresson-low.onnx');
  const raw = out.replace(/\.wav$/, '.raw.wav');
  const r = spawnSync(PYTHON, ['-m', 'piper', '-m', model, '-f', raw, '--length-scale', '0.92'], {
    input: texto,
  });
  if (r.status !== 0) throw new Error(r.stderr.toString());
  // leve tratamento: tira silêncio do começo, normaliza volume
  execFileSync(FFMPEG, [
    '-y', '-loglevel', 'error', '-i', raw,
    '-af', 'silenceremove=start_periods=1:start_threshold=-45dB,loudnorm=I=-16:TP=-1.5,aresample=44100',
    out,
  ]);
  fs.rmSync(raw);
}

// ---------- Kokoro (padrão): uma chamada para todas as frases ----------
const kokoroDir = path.join(root, 'voices', 'kokoro');
const provedor = process.env.ELEVENLABS_API_KEY ? 'elevenlabs' : process.env.TTS ?? (fs.existsSync(kokoroDir) ? 'kokoro' : 'piper');
const frasesDe = (t) => (t.match(/[^.!?]+[.!?]*/g) ?? [t]).map((f) => f.trim()).filter(Boolean);
const tmpDir = path.join(audioDir, '_frases');

const ff = (args) => execFileSync(FFMPEG, ['-y', '-loglevel', 'error', ...args]);
// corta silêncio no começo e no fim
const aparar = (inp, out) =>
  ff(['-i', inp, '-af', 'silenceremove=start_periods=1:start_threshold=-50dB,areverse,silenceremove=start_periods=1:start_threshold=-50dB,areverse,aresample=44100', '-ac', '1', out]);

if (!semVoz && provedor === 'kokoro') {
  fs.rmSync(tmpDir, {recursive: true, force: true});
  fs.mkdirSync(tmpDir, {recursive: true});
  const itens = [];
  for (const cena of roteiro.cenas)
    frasesDe(cena.narracao).forEach((texto, k) => itens.push({texto, saida: path.join(tmpDir, `${cena.id}-${k}.raw.wav`)}));
  const tarefas = path.join(tmpDir, 'tarefas.json');
  fs.writeFileSync(tarefas, JSON.stringify({modelo: kokoroDir, voz: process.env.KOKORO_VOZ ?? roteiro.voz ?? 'pm_santa', velocidade: roteiro.velocidadeVoz ?? 1.05, itens}));
  console.log(`TTS Kokoro: ${itens.length} frases...`);
  const r = spawnSync(PYTHON, [path.join(root, 'scripts', 'tts_kokoro.py'), tarefas], {stdio: ['ignore', 'ignore', 'inherit']});
  if (r.status !== 0) throw new Error('Kokoro falhou');
}

// Legenda: divide cada frase em blocos curtos; o tempo de cada palavra é proporcional ao tamanho dela.
function legendaDe(frases) {
  const blocos = [];
  for (const f of frases) {
    const palavras = f.texto.split(/\s+/).filter(Boolean);
    const pesos = palavras.map((w) => w.replace(/[^\p{L}\p{N}]/gu, '').length + 1.5);
    const total = pesos.reduce((a, b) => a + b, 0);
    let t = f.ini;
    let bloco = null;
    palavras.forEach((w, i) => {
      if (!bloco) blocos.push((bloco = {ini: t, fim: t, palavras: []}));
      bloco.palavras.push({w, ini: t});
      t += (pesos[i] / total) * f.dur;
      bloco.fim = t;
      if (bloco.palavras.length >= 5 || /[,;:]$/.test(w)) bloco = null;
    });
  }
  return blocos;
}

const PAUSA = 0.22;

// Envelope de volume por frame (0..1) para animar a boca do apresentador.
function envelope(wav) {
  const SR = 6000;
  const buf = execFileSync(FFMPEG, ['-loglevel', 'error', '-i', wav, '-ac', '1', '-ar', String(SR), '-f', 's16le', '-'], {maxBuffer: 1 << 28});
  const n = buf.length / 2;
  const porFrame = SR / FPS;
  const rms = [];
  for (let f = 0; f * porFrame < n; f++) {
    let acc = 0, c = 0;
    for (let i = Math.floor(f * porFrame); i < Math.min(n, Math.floor((f + 1) * porFrame)); i++) {
      const v = buf.readInt16LE(i * 2) / 32768;
      acc += v * v; c++;
    }
    rms.push(Math.sqrt(acc / Math.max(1, c)));
  }
  const ord = [...rms].sort((a, b) => a - b);
  const ref = ord[Math.floor(ord.length * 0.95)] || 1;
  return rms.map((v) => Math.round(Math.min(1, Math.max(0, (v / ref - 0.08) / 0.92)) * 100) / 100);
}
const cenas = [];
for (const cena of roteiro.cenas) {
  let audio = null;
  let dur;
  let legenda = [];
  if (!semVoz) {
    const out = path.join(audioDir, `${cena.id}.wav`);
    const frases = [];
    if (provedor === 'kokoro') {
      const partes = [];
      let t = 0;
      frasesDe(cena.narracao).forEach((texto, k) => {
        const raw = path.join(tmpDir, `${cena.id}-${k}.raw.wav`);
        const lim = path.join(tmpDir, `${cena.id}-${k}.wav`);
        aparar(raw, lim);
        const d = duracaoAudio(lim);
        frases.push({texto, ini: t, dur: d});
        partes.push(lim);
        t += d + PAUSA;
      });
      // junta as frases com pausa curta e normaliza volume
      const inputs = partes.flatMap((p) => ['-i', p]);
      const filtro =
        partes.map((_, k) => `[${k}]apad=pad_dur=${PAUSA}[p${k}]`).join(';') +
        ';' + partes.map((_, k) => `[p${k}]`).join('') + `concat=n=${partes.length}:v=0:a=1,loudnorm=I=-16:TP=-1.5,aresample=44100[o]`;
      ff([...inputs, '-filter_complex', filtro, '-map', '[o]', out]);
    } else {
      if (provedor === 'elevenlabs') await ttsElevenLabs(cena.narracao, out);
      else ttsPiper(cena.narracao, out);
      frases.push({texto: cena.narracao, ini: 0, dur: duracaoAudio(out)});
    }
    const d = duracaoAudio(out);
    console.log(`  ${cena.id}: ${d.toFixed(2)}s`);
    audio = `audio/${nome}/${cena.id}.wav`;
    dur = d + 0.35;
    legenda = legendaDe(frases);
    cena.boca = envelope(out);
  } else {
    dur = cena.narracao.split(/\s+/).length / 2.6 + 0.6;
    legenda = legendaDe([{texto: cena.narracao, ini: 0, dur: dur - 0.6}]);
  }
  dur = Math.max(dur, cena.duracaoMin ?? 2.2);
  cenas.push({...cena, texto: preencher(cena.texto), audio, legenda, frames: Math.round(dur * FPS)});
}

const props = {
  ...roteiro,
  tipo: roteiro.tipo ?? 'estrada',
  fps: FPS,
  musica: roteiro.musica ?? null,
  cenas,
};
if (roteiro.carros) props.carros = roteiro.carros.map((c, i) => ({...c, ...tempos[i]}));
const genDir = path.join(root, 'src', 'generated');
fs.writeFileSync(path.join(genDir, `${nome}.json`), JSON.stringify(props, null, 2));
// índice com todos os vídeos já gerados (cada um vira uma composição no Remotion)
const jsons = fs.readdirSync(genDir).filter((f) => f.endsWith('.json')).sort();
fs.writeFileSync(
  path.join(genDir, 'index.ts'),
  jsons.map((f, i) => `import v${i} from './${f}';`).join('\n') +
    `\nexport default {${jsons.map((f, i) => `'${f.replace(/\.json$/, '')}': v${i}`).join(', ')}} as Record<string, any>;\n`,
);
const total = cenas.reduce((a, c) => a + c.frames, 0);
console.log(`Duração total: ${(total / FPS).toFixed(1)}s (${total} frames)`);

if (semRender) process.exit(0);

const outFile = path.join(root, 'out', `${nome}.mp4`);
const renderArgs = [
  'remotion', 'render', 'src/index.ts', nome, outFile,
  '--gl=swangle', '--concurrency=8', '--image-format=jpeg', '--jpeg-quality=92', '--crf=18',
];
if (process.env.REMOTION_BROWSER) renderArgs.push(`--browser-executable=${process.env.REMOTION_BROWSER}`);
if (framesArg) renderArgs.push(`--frames=${framesArg.split('=')[1]}`);
const remotionCli = path.join(root, 'node_modules', '@remotion', 'cli', 'remotion-cli.js');
const r = spawnSync(process.execPath, [remotionCli, ...renderArgs.slice(1)], {cwd: root, stdio: 'inherit'});
process.exit(r.status ?? 1);
