# Vídeos 3D low poly por código

Shorts verticais (1080x1920) de animação 3D low poly, 100% gerados por código: Three.js (React Three Fiber) dentro do Remotion.
Cada vídeo novo = um JSON de roteiro. O 3D é sempre o mesmo kit, então fica consistente de um vídeo para outro.

## Fluxo

```
tema → (Claude escreve) roteiros/<nome>.json → scripts/build.mjs → narração TTS por cena
     → durações das cenas = duração do áudio → Remotion renderiza → out/<nome>.mp4
```

## Rodar

```bash
npm install
pip install kokoro-onnx soundfile   # TTS local (voz pm_santa)
# modelo: voices/kokoro/kokoro.onnx e voices.bin (github.com/thewh1teagle/kokoro-onnx, release model-files-v1.0)
# voz: voices/pt-br-edresson-low.onnx (github.com/rhasspy/piper, release v0.0.2)

node scripts/build.mjs roteiros/velocidade-300km.json            # vídeo completo
node scripts/build.mjs roteiros/velocidade-300km.json --sem-voz  # sem narração (durações estimadas)
node scripts/build.mjs roteiros/velocidade-300km.json --frames=0-90  # só um trecho, para testar
npx remotion studio src/index.ts                                  # preview interativo no navegador
```

Narração: se `ELEVENLABS_API_KEY` estiver definida, usa ElevenLabs (voz em `ELEVENLABS_VOICE_ID`) e salva os
timestamps por palavra; senão usa Piper local. Em máquina sem GPU o render usa `--gl=swangle` (já configurado).
Se o Remotion não conseguir baixar o Chrome, aponte `REMOTION_BROWSER` para um Chrome/Chromium headless.

## Tipos de vídeo (`"tipo"` no roteiro)

| tipo | roteiro de exemplo | o que mostra |
|---|---|---|
| `estrada` | `roteiros/velocidade-300km.json` | carros, barras de tempo, feixe de distância |
| `medidas` | `roteiros/estatistica-1-medidas.json` | colunas neon: ordenar, mediana, moda, média nivelando, valor extremo |
| `ponderada` | `roteiros/estatistica-2-ponderada.json` | gangorra 0–10 com pilhas de blocos (peso) e apoio que acha o equilíbrio |
| `pesquisa` | `roteiros/estatistica-3-pesquisa.json` | multidão de bonequinhos: censo (scanner), amostra (holofotes), etiquetas de variáveis |
| `graficos` | `roteiros/estatistica-4-graficos.json` | colunas + amplitude, linha + maior queda, pizza + ângulo da fatia |

Cada tipo fica em `src/videos/<tipo>.tsx` e é registrado em `src/mundos.ts`. As chaves de cada cena
(ex.: `ordenado`, `acender`, `pilhas`, `apoio`, `censo`, `amostra`, `grafico`, `fatia`) viram um estado
que é interpolado suavemente entre as cenas por `src/core/mix.ts`.

Testar visual rápido sem renderizar tudo: `scripts/stills.sh <nome-do-roteiro> 100 500 900` gera `out/<nome>-grid.jpg`.

## Roteiro (JSON) — tipo estrada

```jsonc
{
  "distanciaKm": 300,
  "carros": [{ "cor": "#1f9e6a", "velocidade": 80 }, ...],   // até 4 faixas
  "musica": "musica/trilha.mp3",                               // opcional, em public/
  "cenas": [{
    "id": "carro80",
    "narracao": "A oitenta por hora ...",        // texto falado (números por extenso)
    "texto": "A VIAGEM LEVA *{tempo0}*",          // título; *destaque* colorido; {tempoN} = tempo calculado do carro N
    "destaque": "#3dd6f5",                        // cor do destaque (padrão verde neon)
    "camera": "atras | baixa | alta | lateral",
    "barras": [0, 1],                             // barras neon de tempo visíveis
    "foco": 0,                                    // carro em destaque (lanternas mais fortes, câmera puxa pro lado)
    "velocidades": true,                          // etiquetas "80 km/h" sobre os carros
    "feixe": "300 km",                            // feixe de luz na pista com rótulo
    "caixa": { "titulo": "RECIFE → NATAL", "sub": "≈ 300 KM DE ESTRADA" },
    "corrida": true,                              // carros se separam conforme a velocidade
    "duracaoMin": 3                               // segundos, opcional
  }]
}
```

Os tempos de viagem (3h45, 3h00...) são calculados de `distanciaKm / velocidade`, então o texto na tela nunca erra a conta.
Entre cenas, câmera, barras, feixe e carros fazem transição suave automaticamente.

## Estrutura

- `src/components/Kit.tsx` — kit 3D: `Road`, `Trees`, `Car`, `NeonBar`, `LightBeam`, `Label`
- `src/World.tsx` — monta a cena 3D a partir do estado do frame
- `src/timeline.ts` — presets de câmera e interpolação entre cenas
- `src/Video.tsx` — céu, títulos animados, caixa de rota, áudio
- `scripts/build.mjs` — pipeline roteiro → TTS → render

## Próximos passos

- Música de fundo (campo `musica`) e efeitos sonoros (whoosh nas transições)
- Legenda palavra a palavra usando os timestamps do ElevenLabs
- Novos kits por nicho (planetas, prédios, aviões) reaproveitando câmera/títulos/timeline
- Prompt fixo para o Claude gerar o JSON a partir de um tema
