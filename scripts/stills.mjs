// Uso: node scripts/stills.mjs <composicao> <frame1> <frame2> ... -> out/<composicao>-grid.jpg
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync, spawnSync} from 'node:child_process';

const [comp, ...frames] = process.argv.slice(2);
if (!comp || frames.length === 0) {
  console.error('Uso: node scripts/stills.mjs <composicao> <frame1> [frame2 ...]');
  process.exit(1);
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'out');
fs.mkdirSync(outDir, {recursive: true});

function resolveFfmpeg() {
  const fromEnv = process.env.FFMPEG_PATH;
  if (fromEnv && fs.existsSync(fromEnv)) return fromEnv;
  const check = spawnSync('ffmpeg', ['-version'], {stdio: 'ignore'});
  if (!check.error && check.status === 0) return 'ffmpeg';
  if (process.platform === 'win32') {
    const kritaFfmpeg = 'C:\\Program Files\\Krita (x64)\\bin\\ffmpeg.exe';
    if (fs.existsSync(kritaFfmpeg)) return kritaFfmpeg;
  }
  return 'ffmpeg';
}

const FFMPEG = resolveFfmpeg();
const remotionCli = path.join(root, 'node_modules', '@remotion', 'cli', 'remotion-cli.js');
const stillPaths = [];

for (const frame of frames) {
  const outStill = path.join(outDir, `s-${comp}-${frame}.jpg`);
  const args = [
    remotionCli, 'still', 'src/index.ts', comp, outStill,
    `--frame=${frame}`, '--scale=0.4', '--gl=swangle',
  ];
  if (process.env.REMOTION_BROWSER) args.push(`--browser-executable=${process.env.REMOTION_BROWSER}`);
  const res = spawnSync(process.execPath, args, {cwd: root, stdio: 'inherit'});
  if (res.status !== 0) process.exit(res.status ?? 1);
  stillPaths.push(outStill);
}

const gridOut = path.join(outDir, `${comp}-grid.jpg`);
if (stillPaths.length === 1) {
  fs.copyFileSync(stillPaths[0], gridOut);
} else {
  const inputs = stillPaths.flatMap((p) => ['-i', p]);
  execFileSync(FFMPEG, [
    '-y', '-loglevel', 'error',
    ...inputs,
    '-filter_complex', `hstack=inputs=${stillPaths.length}:shortest=1`,
    gridOut,
  ]);
}
console.log(`Gerado: ${gridOut}`);
