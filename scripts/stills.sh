#!/bin/bash
# Uso: scripts/stills.sh <composicao> <frame1> <frame2> ...  -> out/<composicao>-grid.jpg; fi
export REMOTION_BROWSER=${REMOTION_BROWSER:-/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell}
comp=$1; shift
inputs=(); n=0
for f in "$@"; do
  npx remotion still src/index.ts $comp out/s-$comp-$f.jpg --frame=$f --scale=0.4 2>&1 | grep -E "Error|error" | head -5
  inputs+=(-i out/s-$comp-$f.jpg); n=$((n+1))
done
if [ $n -eq 1 ]; then cp out/s-$comp-$1.jpg out/$comp-grid.jpg; else ffmpeg -y -loglevel error "${inputs[@]}" -filter_complex "hstack=inputs=$n:shortest=1" out/$comp-grid.jpg; fi
