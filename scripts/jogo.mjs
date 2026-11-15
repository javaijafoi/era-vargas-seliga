import {spawnSync} from 'node:child_process';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import zlib from 'node:zlib';
import esbuild from 'esbuild';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const PUBLIC_DIR = path.join(ROOT, 'public');
const OUT_DIR = path.join(PUBLIC_DIR, 'jogo');
const AUDIO_SRC_DIR = path.join(PUBLIC_DIR, 'audio', 'getulio-vargas-seliga');
const AUDIO_OUT_DIR = path.join(OUT_DIR, 'audio');
const ENTRY = path.join(ROOT, 'src', 'jogo', 'index.tsx');
const PORT = Number(process.env.PORT || 3030);

const AUDIOS_JOGO = [
  'eleicao-1930',
  'mundo-crise',
  'interventores',
  'revolucao-32',
  'constituicao-34',
  'intentona-35',
  'plano-cohen',
  'intentona-integralista',
  'dip-propaganda',
  'segunda-guerra',
  'clt-1943',
  'abertura-1945',
  'tres-golpes',
  'cta-final',
];

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.wav': 'audio/wav',
  '.mp3': 'audio/mpeg',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
};

const COMPRESSIBLE_EXTS = new Set(['.html', '.js', '.css', '.json']);

function findFfmpeg() {
  const candidates = ['ffmpeg', 'C:\\Program Files\\Krita (x64)\\bin\\ffmpeg.exe'];
  for (const bin of candidates) {
    const res = spawnSync(bin, ['-version'], {stdio: 'ignore'});
    if (res.status === 0) return bin;
  }
  return null;
}

function compressAudios() {
  fs.mkdirSync(AUDIO_OUT_DIR, {recursive: true});
  const ffmpeg = findFfmpeg();
  if (!ffmpeg) {
    throw new Error('ffmpeg não encontrado no PATH nem em C:\\Program Files\\Krita (x64)\\bin\\ffmpeg.exe');
  }

  let convertidos = 0;
  for (const nome of AUDIOS_JOGO) {
    const src = path.join(AUDIO_SRC_DIR, `${nome}.wav`);
    const dst = path.join(AUDIO_OUT_DIR, `${nome}.mp3`);
    if (fs.existsSync(dst)) continue;
    if (!fs.existsSync(src)) {
      console.warn(`[jogo] Aviso: WAV ausente ${src}`);
      continue;
    }
    const res = spawnSync(
      ffmpeg,
      ['-y', '-i', src, '-codec:a', 'libmp3lame', '-b:a', '64k', '-ac', '1', '-ar', '24000', dst],
      {stdio: 'pipe'},
    );
    if (res.status !== 0) {
      throw new Error(`Falha ao converter ${nome}.wav: ${res.stderr?.toString()}`);
    }
    convertidos++;
  }
  console.log(`[jogo] Áudios MP3 prontos em public/jogo/audio/ (${convertidos} convertidos agora)`);
}

function cleanOutAssets() {
  fs.mkdirSync(OUT_DIR, {recursive: true});
  for (const entry of fs.readdirSync(OUT_DIR, {withFileTypes: true})) {
    if (entry.isDirectory()) continue;
    fs.unlinkSync(path.join(OUT_DIR, entry.name));
  }
}

const remotionStubPlugin = {
  name: 'remotion-stub',
  setup(build) {
    build.onResolve({filter: /^(@remotion\/three|remotion)$/}, (args) => ({
      path: args.path,
      namespace: 'remotion-stub',
    }));
    build.onLoad({filter: /.*/, namespace: 'remotion-stub'}, () => ({
      contents: `
        export const useCurrentFrame = () => 0;
        export const useVideoConfig = () => ({ width: 1080, height: 1920, fps: 30, durationInFrames: 1 });
        export const ThreeCanvas = () => null;
        export const AbsoluteFill = ({ children }) => children ?? null;
        export const Audio = () => null;
        export const Sequence = ({ children }) => children ?? null;
        export const staticFile = (p) => p;
        export const spring = () => 1;
        export const interpolate = (x, _inR, outR) => outR?.[0] ?? x;
        export const continueRender = () => {};
        export const delayRender = () => 0;
      `,
      loader: 'js',
    }));
  },
};

async function buildBundle() {
  cleanOutAssets();
  await esbuild.build({
    entryPoints: [ENTRY],
    bundle: true,
    minify: true,
    treeShaking: true,
    outfile: path.join(OUT_DIR, 'bundle.js'),
    platform: 'browser',
    format: 'iife',
    target: ['es2020'],
    jsx: 'automatic',
    plugins: [remotionStubPlugin],
    loader: {
      '.woff2': 'file',
      '.woff': 'file',
      '.ttf': 'file',
      '.svg': 'file',
      '.png': 'file',
    },
    define: {
      'process.env.NODE_ENV': '"production"',
    },
  });
  console.log('[jogo] Bundle minificado gerado em public/jogo/bundle.js');
}

function resolvePublicFile(reqUrl) {
  const cleanUrl = (reqUrl || '/').split('?')[0];
  const rel = cleanUrl === '/' || cleanUrl === '/jogo' || cleanUrl === '/jogo/' ? '/jogo.html' : decodeURIComponent(cleanUrl);
  const fullPath = path.resolve(PUBLIC_DIR, `.${rel}`);
  if (!fullPath.startsWith(PUBLIC_DIR)) return null;
  return fullPath;
}

function startServer() {
  const server = http.createServer((req, res) => {
    const filePath = resolvePublicFile(req.url);
    if (!filePath || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      res.writeHead(404, {'Content-Type': 'text/plain; charset=utf-8'});
      res.end('Not found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    const stat = fs.statSync(filePath);
    const total = stat.size;
    const range = req.headers.range;

    if (range) {
      const match = /bytes=(\d+)-(\d*)/.exec(range);
      const start = match ? parseInt(match[1], 10) : 0;
      const end = match && match[2] ? parseInt(match[2], 10) : total - 1;
      if (start >= total || end >= total) {
        res.writeHead(416, {'Content-Range': `bytes */${total}`});
        res.end();
        return;
      }
      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${total}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': end - start + 1,
        'Content-Type': contentType,
      });
      fs.createReadStream(filePath, {start, end}).pipe(res);
      return;
    }

    const acceptGzip = typeof req.headers['accept-encoding'] === 'string' && req.headers['accept-encoding'].includes('gzip');
    if (acceptGzip && COMPRESSIBLE_EXTS.has(ext)) {
      const gz = zlib.gzipSync(fs.readFileSync(filePath));
      res.writeHead(200, {
        'Content-Length': gz.length,
        'Content-Type': contentType,
        'Content-Encoding': 'gzip',
        'Vary': 'Accept-Encoding',
      });
      res.end(gz);
      return;
    }

    res.writeHead(200, {
      'Content-Length': total,
      'Content-Type': contentType,
      'Accept-Ranges': 'bytes',
    });
    fs.createReadStream(filePath).pipe(res);
  });

  server.listen(PORT, '127.0.0.1', () => {
    console.log(`[jogo] Servidor rodando em http://localhost:${PORT}`);
  });
}

compressAudios();
await buildBundle();

if (!process.argv.includes('--build-only')) {
  startServer();
}
