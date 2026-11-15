"""TTS local com Kokoro (pt-BR). Lê um JSON de tarefas e gera um WAV por frase.

Uso: python3 scripts/tts_kokoro.py tarefas.json
tarefas.json = {"modelo": "voices/kokoro", "voz": "pm_alex", "velocidade": 1.0,
                "itens": [{"texto": "...", "saida": "x.wav"}, ...]}
"""
import json
import sys

import soundfile as sf
from kokoro_onnx import Kokoro

cfg = json.load(open(sys.argv[1], encoding="utf-8"))
k = Kokoro(cfg["modelo"] + "/kokoro.onnx", cfg["modelo"] + "/voices.bin")
for it in cfg["itens"]:
    audio, sr = k.create(it["texto"], voice=cfg.get("voz", "pm_alex"), speed=cfg.get("velocidade", 1.0), lang="pt-br")
    sf.write(it["saida"], audio, sr)
    print(it["saida"], round(len(audio) / sr, 2), flush=True)
