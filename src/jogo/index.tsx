import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {flushSync} from 'react-dom';
import {createRoot} from 'react-dom/client';
import {Canvas, useFrame} from '@react-three/fiber';
import '@fontsource/montserrat/latin-800.css';
import '@fontsource/montserrat/latin-900.css';

import {CAMERAS_VARGAS, CenaPalcoVargas} from '../videos/vargas';
import {Cabeca} from '../core/Apresentador';
import {lerp} from '../core/mix';
import faseJson from '../../fases/era-vargas.json';

const LogoSeLiga: React.FC<{size?: number}> = ({size = 66}) => {
  const pad = Math.max(3, Math.round(size * 0.04));
  const fs = Math.round(size * 0.28);
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        padding: pad,
        flexShrink: 0,
        background: 'linear-gradient(135deg, #ff1e56 0%, #ff8a00 100%)',
        boxShadow: '0 8px 20px rgba(0,0,0,0.55)',
      }}
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          borderRadius: '50%',
          background: '#ffd000',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 900,
          letterSpacing: -size * 0.015,
        }}
      >
        <svg viewBox="0 0 100 100" style={{position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none'}}>
          {[-28, 2, 32, 64].map((ang, idx) => (
            <rect
              key={idx}
              x="71"
              y="22"
              width="5.5"
              height="11"
              rx="2.75"
              fill="#ffffff"
              transform={`rotate(${ang} 74 44)`}
            />
          ))}
        </svg>
        <div style={{color: '#14100b', fontSize: fs, lineHeight: 0.9, marginLeft: -size * 0.08}}>Se</div>
        <div style={{color: '#ffffff', fontSize: fs, lineHeight: 0.96, textShadow: '0 2px 0 rgba(0,0,0,0.08)'}}>Liga</div>
      </div>
    </div>
  );
};

type PilarId = 'exercito' | 'povo' | 'elite' | 'poder';

interface OpcaoJogo {
  texto: string;
  efeitos: Record<PilarId, number>;
  carimbo: string;
  historico: boolean;
  estadoResultado?: Record<string, number>;
  resultado: string;
}

interface AtoJogo {
  id: string;
  ano: string;
  epoca: string;
  titulo: string;
  pergunta: string;
  comentarioProf: string;
  audio?: string;
  camera: string;
  estado: Record<string, number>;
  opcoes: OpcaoJogo[];
}

interface RegistroEscolha {
  ano: string;
  titulo: string;
  escolha: string;
  carimbo: string;
  historico: boolean;
}

const ESTADO_KEYS = [
  'heroiVilao',
  'tresFases',
  'cafe',
  'operarios',
  'eleicao1930',
  'interventores',
  'ministerios',
  'revolucao32',
  'carta34',
  'planoCohen',
  'estadoNovo',
  'pijama',
  'dipGuerra',
  'industria',
  'clt',
  'golpe1945',
  'alertaExtra',
  'elevacaoExtra',
  'dramaticoExtra',
] as const;

const FAIXAS_SELIGA = ['#ffd400', '#ffba00', '#ff9e00', '#ff7b00', '#f05a00'];

const CAMERA_OPCOES: {id: string; label: string}[] = [
  {id: 'auto', label: 'Auto'},
  {id: 'palco', label: 'Palco'},
  {id: 'close', label: 'Close'},
  {id: 'alta', label: 'Alta'},
  {id: 'esquerda', label: 'Esq.'},
  {id: 'direita', label: 'Dir.'},
  {id: 'palacio', label: 'Catete'},
];

const supportsScopedTransition =
  typeof Element !== 'undefined' && 'startViewTransition' in Element.prototype;

function runScopedCardTransition(
  scopeEl: HTMLElement | null,
  updateDOM: () => void,
  afterUpdate?: () => void,
) {
  if (!supportsScopedTransition || !scopeEl) {
    updateDOM();
    requestAnimationFrame(() => afterUpdate?.());
    return;
  }
  const transition = (scopeEl as any).startViewTransition(() => {
    flushSync(() => {
      updateDOM();
    });
    afterUpdate?.();
  });
  transition?.ready?.catch?.(() => {});
}

const DisclaimerHomenagem: React.FC<{textAlign?: 'left' | 'center'}> = ({textAlign = 'left'}) => (
  <div
    style={{
      marginTop: 10,
      padding: '8px 12px',
      borderRadius: 10,
      background: 'rgba(10, 3, 20, 0.55)',
      border: '1px solid rgba(255, 208, 0, 0.35)',
      fontSize: 11,
      lineHeight: 1.4,
      color: '#e2d6f8',
      textAlign,
    }}
  >
    <strong style={{color: '#ffd000'}}>Aviso:</strong> Este jogo <strong>não foi feito pelo Se Liga</strong> — é uma
    homenagem independente inspirada na aula sobre a Era Vargas. Qualquer simplificação, adaptação ou eventual erro histórico
    é de inteira responsabilidade de quem criou este experimento, sem vínculo oficial com a equipe do Se Liga (
    <a href="https://seliga.com.br" target="_blank" rel="noreferrer" style={{color: '#ffd000'}}>
      seliga.com.br
    </a>
    ).
  </div>
);

// Fundo teatral Se Liga adaptado para Web em tempo real
const FundoSeLigaWeb: React.FC = () => (
  <div style={{position: 'fixed', inset: 0, background: '#090312', overflow: 'hidden', zIndex: 0}}>
    <div style={{position: 'absolute', inset: 0, bottom: '45%', display: 'flex'}}>
      {FAIXAS_SELIGA.map((cor, idx) => (
        <div key={idx} style={{flex: 1, backgroundColor: cor}} />
      ))}
    </div>
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '40vw',
        height: '32vh',
        opacity: 0.2,
        backgroundImage: 'radial-gradient(#ffffff 3px, transparent 3.5px)',
        backgroundSize: '20px 20px',
        maskImage: 'radial-gradient(circle at 0% 0%, black 20%, transparent 78%)',
        WebkitMaskImage: 'radial-gradient(circle at 0% 0%, black 20%, transparent 78%)',
      }}
    />
    <svg
      width="420"
      height="420"
      viewBox="0 0 200 200"
      style={{position: 'absolute', right: -40, top: 80, opacity: 0.16, pointerEvents: 'none'}}
    >
      <circle cx="100" cy="120" r="46" fill="none" stroke="#ffffff" strokeWidth="6" />
      {[-55, -22, 12, 46].map((deg, idx) => (
        <rect
          key={idx}
          x="93"
          y="18"
          width="14"
          height="36"
          rx="7"
          fill="none"
          stroke="#ffffff"
          strokeWidth="4"
          transform={`rotate(${deg} 100 120)`}
        />
      ))}
    </svg>
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background:
          'linear-gradient(180deg, rgba(18,7,31,0.12) 0%, rgba(18,7,31,0.72) 46%, #12071f 68%, #090312 100%)',
      }}
    />
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: 'radial-gradient(ellipse at 50% 55%, transparent 55%, rgba(0,0,0,0.58) 100%)',
      }}
    />
  </div>
);

interface TargetPalco {
  camera: string;
  estado: Record<string, number>;
  enquadramentoJogo: boolean;
}

const AnimadorPalco: React.FC<{alvo: TargetPalco}> = ({alvo}) => {
  const frameRef = useRef(0);
  const accRef = useRef(0);

  const curRef = useRef<any>({
    camPos: [...CAMERAS_VARGAS.palco.pos],
    camLook: [...CAMERAS_VARGAS.palco.look],
    heroiVilao: 1,
    tresFases: 0,
    cafe: 0,
    operarios: 0,
    eleicao1930: 0,
    interventores: 0,
    ministerios: 0,
    revolucao32: 0,
    carta34: 0,
    planoCohen: 0,
    estadoNovo: 0,
    pijama: 0,
    dipGuerra: 0,
    industria: 0,
    clt: 0,
    golpe1945: 0,
    alertaExtra: 0,
    elevacaoExtra: 0,
    dramaticoExtra: 0,
  });

  const [snapshot, setSnapshot] = useState<{st: any; frame: number}>(() => ({
    st: {...curRef.current, camPos: [...curRef.current.camPos], camLook: [...curRef.current.camLook]},
    frame: 0,
  }));

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.1);
    frameRef.current += dt * 30;
    accRef.current += dt;

    const kCam = 1 - Math.exp(-dt * 3.8);
    const kProp = 1 - Math.exp(-dt * 4.6);
    const baseCam = CAMERAS_VARGAS[alvo.camera] ?? CAMERAS_VARGAS.palco;
    const camPosTarget = alvo.enquadramentoJogo
      ? [baseCam.pos[0], baseCam.pos[1] + 0.5, baseCam.pos[2] + 5.2]
      : baseCam.pos;
    const camLookTarget = alvo.enquadramentoJogo
      ? [baseCam.look[0], Math.max(0.8, baseCam.look[1] - 0.85), baseCam.look[2]]
      : baseCam.look;
    const cur = curRef.current;

    for (let j = 0; j < 3; j++) {
      cur.camPos[j] = lerp(cur.camPos[j], camPosTarget[j], kCam);
      cur.camLook[j] = lerp(cur.camLook[j], camLookTarget[j], kCam);
    }

    for (const key of ESTADO_KEYS) {
      const targetVal = alvo.estado[key] ?? 0;
      cur[key] = lerp(cur[key], targetVal, kProp);
      if (Math.abs(cur[key] - targetVal) < 0.002) cur[key] = targetVal;
    }

    if (accRef.current >= 1 / 32) {
      accRef.current = 0;
      setSnapshot({
        st: {...cur, camPos: [...cur.camPos], camLook: [...cur.camLook]},
        frame: frameRef.current,
      });
    }
  });

  return <CenaPalcoVargas st={snapshot.st} frame={snapshot.frame} />;
};

const AnimadorCabeca: React.FC<{falando: boolean}> = ({falando}) => {
  const frameRef = useRef(0);
  const accRef = useRef(0);
  const bocaRef = useRef(0);
  const [snap, setSnap] = useState({frame: 0, boca: 0});

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.1);
    frameRef.current += dt * 30;
    accRef.current += dt;
    const t = frameRef.current / 30;
    const alvoBoca = falando
      ? Math.min(1, 0.18 + 0.65 * Math.abs(Math.sin(t * 10.5) * Math.cos(t * 4.2)))
      : 0;
    bocaRef.current = lerp(bocaRef.current, alvoBoca, 1 - Math.exp(-dt * 14));

    if (accRef.current >= 1 / 24) {
      accRef.current = 0;
      setSnap({frame: Math.floor(frameRef.current), boca: bocaRef.current});
    }
  });

  return (
    <>
      <hemisphereLight args={['#dfe8ff', '#334', 1.1]} />
      <directionalLight position={[3, 4, 6]} intensity={1.6} />
      <directionalLight position={[-4, 1, 2]} intensity={0.5} color="#9fc0ff" />
      <group position={[0, -0.15, 0]}>
        <Cabeca boca={snap.boca} frame={snap.frame} />
      </group>
    </>
  );
};

const AvatarSeLigaHud: React.FC<{
  falando: boolean;
  fala: string;
  audioLigado: boolean;
  onToggleAudio: () => void;
  onReplayAudio?: () => void;
  temAudio: boolean;
}> = ({falando, fala, audioLigado, onToggleAudio, onReplayAudio, temAudio}) => (
  <div style={{display: 'flex', alignItems: 'flex-start', gap: 12, maxWidth: 440, pointerEvents: 'auto'}}>
    <div style={{position: 'relative', flexShrink: 0}}>
      <div
        style={{
          width: 82,
          height: 82,
          borderRadius: '50%',
          overflow: 'hidden',
          border: '4px solid #ffd000',
          boxShadow: '0 0 20px rgba(255, 208, 0, 0.55)',
          background: 'radial-gradient(circle at 50% 40%, #ffae00 0%, #d45500 75%)',
        }}
      >
        <Canvas camera={{fov: 30, position: [0, -0.35, 5.6]}} gl={{antialias: true, alpha: true}}>
          <AnimadorCabeca falando={falando} />
        </Canvas>
      </div>
      <div
        style={{
          position: 'absolute',
          bottom: -8,
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#ffd000',
          color: '#1a082e',
          fontWeight: 900,
          fontSize: 11,
          padding: '2px 8px',
          borderRadius: 8,
          whiteSpace: 'nowrap',
          border: '2px solid #1a082e',
        }}
      >
        SE LIGA
      </div>
    </div>

    <div
      style={{
        background: 'rgba(24, 8, 44, 0.9)',
        border: '2px solid #ffd000',
        borderRadius: 14,
        padding: '10px 14px',
        boxShadow: '5px 5px 0 #ff6b00',
        fontSize: 13,
        lineHeight: 1.38,
        color: '#f7f2ff',
      }}
    >
      <div style={{fontWeight: 800}}>{fala}</div>
      <div style={{display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap'}}>
        <button
          type="button"
          onClick={onToggleAudio}
          style={{
            background: audioLigado ? '#ffd000' : 'rgba(255,255,255,0.12)',
            color: audioLigado ? '#1a082e' : '#ffffff',
            border: 'none',
            borderRadius: 8,
            padding: '4px 10px',
            fontWeight: 900,
            fontSize: 11,
            cursor: 'pointer',
          }}
        >
          {audioLigado ? '🔊 Voz ON' : '🔇 Voz OFF'}
        </button>
        {temAudio && onReplayAudio && (
          <button
            type="button"
            onClick={onReplayAudio}
            style={{
              background: 'rgba(255, 255, 255, 0.14)',
              color: '#ffd000',
              border: '1px solid #ffd000',
              borderRadius: 8,
              padding: '4px 10px',
              fontWeight: 800,
              fontSize: 11,
              cursor: 'pointer',
            }}
          >
            ↻ Ouvir ato
          </button>
        )}
      </div>
    </div>
  </div>
);

const MedidoresPilares: React.FC<{
  pilares: typeof faseJson.pilares;
  valores: Record<PilarId, number>;
  previewEfeitos: Record<PilarId, number> | null;
  ultimosDeltas: Record<PilarId, number> | null;
}> = ({pilares, valores, previewEfeitos, ultimosDeltas}) => (
  <div
    style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(4, minmax(110px, 150px))',
      gap: 10,
      background: 'rgba(18, 7, 31, 0.88)',
      border: '3px solid #ffd000',
      borderRadius: 16,
      padding: '10px 14px',
      boxShadow: '6px 6px 0 #ff6b00, 0 12px 28px rgba(0,0,0,0.65)',
      pointerEvents: 'auto',
    }}
  >
    {pilares.map((p) => {
      const id = p.id as PilarId;
      const val = valores[id];
      const emPerigo = val <= 18 || val >= 84;
      const prev = previewEfeitos ? previewEfeitos[id] : 0;
      const delta = ultimosDeltas ? ultimosDeltas[id] : 0;
      return (
        <div
          key={p.id}
          className={emPerigo ? 'pilar-perigo' : undefined}
          style={{
            background: 'rgba(255,255,255,0.05)',
            borderRadius: 10,
            padding: '6px 8px',
            border: emPerigo ? '2px solid #ff2d55' : '1px solid rgba(255,255,255,0.12)',
          }}
        >
          <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12, fontWeight: 900}}>
            <span>
              {p.icone} {p.nome}
            </span>
            {prev !== 0 ? (
              <span
                style={{
                  color: prev > 0 ? '#3df28f' : '#ff4d6d',
                  fontSize: 13,
                  fontWeight: 900,
                }}
              >
                {prev > 0 ? (Math.abs(prev) >= 15 ? '▲▲' : '▲') : Math.abs(prev) >= 15 ? '▼▼' : '▼'}
              </span>
            ) : delta !== 0 ? (
              <span
                style={{
                  color: delta > 0 ? '#3df28f' : '#ff4d6d',
                  fontSize: 12,
                  fontWeight: 900,
                }}
              >
                {delta > 0 ? `+${delta}` : delta}
              </span>
            ) : (
              <span style={{color: emPerigo ? '#ff4d6d' : '#d6c8eb', fontSize: 12}}>{val}%</span>
            )}
          </div>
          <div
            style={{
              marginTop: 6,
              height: 10,
              borderRadius: 99,
              background: 'rgba(0,0,0,0.55)',
              position: 'relative',
              overflow: 'hidden',
              border: '1px solid rgba(255,255,255,0.15)',
            }}
          >
            {/* zonas de colapso nos extremos */}
            <div style={{position: 'absolute', left: 0, top: 0, bottom: 0, width: '10%', background: 'rgba(255,45,85,0.28)'}} />
            <div style={{position: 'absolute', right: 0, top: 0, bottom: 0, width: '10%', background: 'rgba(255,45,85,0.28)'}} />
            <div
              style={{
                width: `${val}%`,
                height: '100%',
                background: emPerigo ? '#ff2d55' : p.cor,
                transition: 'width 280ms ease, background-color 200ms ease',
              }}
            />
          </div>
        </div>
      );
    })}
  </div>
);

const AppJogoVargas: React.FC = () => {
  const atos = faseJson.atos as AtoJogo[];
  const pilares = faseJson.pilares;

  const [faseTela, setFaseTela] = useState<'inicio' | 'dilema' | 'resultado' | 'fim'>('inicio');
  const [atoIdx, setAtoIdx] = useState(0);
  const [valores, setValores] = useState<Record<PilarId, number>>({
    exercito: 50,
    povo: 50,
    elite: 50,
    poder: 50,
  });
  const [opcaoEscolhida, setOpcaoEscolhida] = useState<OpcaoJogo | null>(null);
  const [ultimosDeltas, setUltimosDeltas] = useState<Record<PilarId, number> | null>(null);
  const [quedaMotivo, setQuedaMotivo] = useState<{titulo: string; carimbo: string; texto: string} | null>(null);
  const [historicoLog, setHistoricoLog] = useState<RegistroEscolha[]>([]);
  const [hoverOpcao, setHoverOpcao] = useState<number | null>(null);

  const [cameraOverride, setCameraOverride] = useState<string>('auto');
  const [espiarPalco, setEspiarPalco] = useState(false);

  const [audioLigado, setAudioLigado] = useState(true);
  const [falando, setFalando] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const falaTimerRef = useRef<number | null>(null);

  const cardScopeRef = useRef<HTMLDivElement | null>(null);
  const btnIniciarRef = useRef<HTMLButtonElement | null>(null);
  const btnOpcao0Ref = useRef<HTMLButtonElement | null>(null);
  const btnProximoRef = useRef<HTMLButtonElement | null>(null);

  const atoAtual = atos[atoIdx] ?? atos[0];

  const alvoPalco: TargetPalco = useMemo(() => {
    const enquadramentoJogo = !espiarPalco;
    if (faseTela === 'inicio') {
      return {
        camera: cameraOverride === 'auto' ? 'palco' : cameraOverride,
        estado: {heroiVilao: 1},
        enquadramentoJogo,
      };
    }
    if (faseTela === 'fim') {
      return {
        camera: cameraOverride === 'auto' ? 'palco' : cameraOverride,
        estado: quedaMotivo
          ? {golpe1945: 1, alertaExtra: 1}
          : {heroiVilao: 1, tresFases: 1},
        enquadramentoJogo,
      };
    }
    const cam = cameraOverride === 'auto' ? atoAtual.camera : cameraOverride;
    const estado =
      faseTela === 'resultado' && opcaoEscolhida?.estadoResultado
        ? opcaoEscolhida.estadoResultado
        : atoAtual.estado;
    return {camera: cam, estado, enquadramentoJogo};
  }, [faseTela, atoAtual, opcaoEscolhida, cameraOverride, quedaMotivo, espiarPalco]);

  const pararAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    if (falaTimerRef.current) {
      window.clearTimeout(falaTimerRef.current);
      falaTimerRef.current = null;
    }
    setFalando(false);
  }, []);

  const tocarAudio = useCallback(
    (src?: string, simularDuracaoMs = 2800) => {
      pararAudio();
      if (!src || !audioLigado) {
        setFalando(true);
        falaTimerRef.current = window.setTimeout(() => setFalando(false), simularDuracaoMs);
        return;
      }
      const audio = new Audio(src);
      audioRef.current = audio;
      audio.onplay = () => setFalando(true);
      audio.onended = () => setFalando(false);
      audio.onerror = () => setFalando(false);
      audio.play().catch(() => {
        setFalando(true);
        falaTimerRef.current = window.setTimeout(() => setFalando(false), simularDuracaoMs);
      });
    },
    [audioLigado, pararAudio],
  );

  useEffect(() => {
    return () => pararAudio();
  }, [pararAudio]);

  // Preload automático do áudio do próximo ato
  useEffect(() => {
    if (!audioLigado) return;
    const prox = atos[atoIdx + 1]?.audio;
    if (!prox) return;
    const pre = new Audio(prox);
    pre.preload = 'auto';
  }, [atoIdx, atos, audioLigado]);

  const iniciarJogo = useCallback(() => {
    runScopedCardTransition(
      cardScopeRef.current,
      () => {
        setAtoIdx(0);
        setValores({exercito: 50, povo: 50, elite: 50, poder: 50});
        setOpcaoEscolhida(null);
        setUltimosDeltas(null);
        setQuedaMotivo(null);
        setHistoricoLog([]);
        setHoverOpcao(null);
        setEspiarPalco(false);
        setFaseTela('dilema');
      },
      () => btnOpcao0Ref.current?.focus(),
    );
    tocarAudio(atos[0].audio);
  }, [atos, tocarAudio]);

  const escolherOpcao = useCallback(
    (opcao: OpcaoJogo) => {
      if (faseTela !== 'dilema') return;
      const novos: Record<PilarId, number> = {...valores};
      let motivo: {titulo: string; carimbo: string; texto: string} | null = null;
      const quedas = faseJson.quedas as Record<string, {titulo: string; carimbo: string; texto: string}>;

      for (const p of pilares) {
        const id = p.id as PilarId;
        const raw = valores[id] + (opcao.efeitos[id] ?? 0);
        novos[id] = Math.max(0, Math.min(100, raw));
        if (!motivo) {
          if (novos[id] <= 0) motivo = quedas[`${id}_min`];
          else if (novos[id] >= 100) motivo = quedas[`${id}_max`];
        }
      }

      pararAudio();
      setFalando(true);
      falaTimerRef.current = window.setTimeout(() => setFalando(false), 2400);

      runScopedCardTransition(
        cardScopeRef.current,
        () => {
          setValores(novos);
          setUltimosDeltas(opcao.efeitos);
          setOpcaoEscolhida(opcao);
          setHoverOpcao(null);
          setQuedaMotivo(motivo);
          setHistoricoLog((prev) => [
            ...prev,
            {
              ano: atoAtual.ano,
              titulo: atoAtual.titulo,
              escolha: opcao.texto,
              carimbo: opcao.carimbo,
              historico: opcao.historico,
            },
          ]);
          setFaseTela('resultado');
        },
        () => btnProximoRef.current?.focus(),
      );
    },
    [atoAtual, faseTela, pararAudio, pilares, valores],
  );

  const avancarProximo = useCallback(() => {
    if (faseTela !== 'resultado') return;

    if (quedaMotivo || atoIdx >= atos.length - 1) {
      const audioFinal = quedaMotivo
        ? 'jogo/audio/tres-golpes.mp3'
        : 'jogo/audio/cta-final.mp3';
      runScopedCardTransition(cardScopeRef.current, () => {
        setUltimosDeltas(null);
        setFaseTela('fim');
      });
      tocarAudio(audioFinal);
      return;
    }

    const proxIdx = atoIdx + 1;
    runScopedCardTransition(
      cardScopeRef.current,
      () => {
        setAtoIdx(proxIdx);
        setOpcaoEscolhida(null);
        setUltimosDeltas(null);
        setHoverOpcao(null);
        setFaseTela('dilema');
      },
      () => btnOpcao0Ref.current?.focus(),
    );
    tocarAudio(atos[proxIdx].audio);
  }, [atoIdx, atos, faseTela, quedaMotivo, tocarAudio]);

  // Atalhos de teclado: 1/←, 2/→, Enter/Space, C para trocar câmera
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'c' || e.key === 'C') {
        setCameraOverride((cur) => {
          const idx = CAMERA_OPCOES.findIndex((x) => x.id === cur);
          return CAMERA_OPCOES[(idx + 1) % CAMERA_OPCOES.length].id;
        });
        return;
      }
      if (faseTela === 'inicio' && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        iniciarJogo();
      } else if (faseTela === 'dilema' && !espiarPalco) {
        if (e.key === 'ArrowLeft' || e.key === '1') {
          e.preventDefault();
          escolherOpcao(atoAtual.opcoes[0]);
        } else if (e.key === 'ArrowRight' || e.key === '2') {
          e.preventDefault();
          escolherOpcao(atoAtual.opcoes[1]);
        }
      } else if (faseTela === 'resultado' && !espiarPalco && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        avancarProximo();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [atoAtual, avancarProximo, escolherOpcao, espiarPalco, faseTela, iniciarJogo]);

  const falaAtual = useMemo(() => {
    if (faseTela === 'inicio') {
      return 'Fala, povo lindo! Consegue equilibrar Exército, Povo, Elite e Controle de 1930 a 1945 sem cair no golpe?';
    }
    if (faseTela === 'dilema') return atoAtual.comentarioProf;
    if (faseTela === 'resultado' && opcaoEscolhida) {
      return quedaMotivo
        ? `Eita! ${quedaMotivo.titulo} Um dos pilares saiu do controle!`
        : opcaoEscolhida.historico
          ? 'Você seguiu exatamente a jogada histórica do Getúlio Vargas!'
          : 'Olha o "E se..."! Mudou a linha do tempo na marra!';
    }
    if (quedaMotivo) {
      return 'Caiu antes de 1945! Bora ver onde o palco virou ou tentar equilibrar de novo!';
    }
    return 'Chegou até 1945! Esse foi o resumo jogável — assiste ao vídeo completo no Se Liga!';
  }, [atoAtual, faseTela, opcaoEscolhida, quedaMotivo]);

  const acertosHistoricos = historicoLog.filter((h) => h.historico).length;

  const tituloVeredito = useMemo(() => {
    if (quedaMotivo) return quedaMotivo.titulo;
    if (acertosHistoricos >= 10) return 'EQUILIBRISTA SUPREMO DO CATETE';
    if (valores.povo >= 75) return 'PAI DOS POBRES (E DA HISTÓRIA ALTERNATIVA)';
    if (valores.poder >= 78) return 'ARQUITETO DE FERRO';
    return 'SENHOR DE UMA NOVA HISTÓRIA';
  }, [acertosHistoricos, quedaMotivo, valores.poder, valores.povo]);

  const previewAtual =
    faseTela === 'dilema' && hoverOpcao !== null ? atoAtual.opcoes[hoverOpcao]?.efeitos ?? null : null;

  return (
    <div style={{position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden'}}>
      <FundoSeLigaWeb />

      {/* Palco 3D Low-Poly em tempo real (src/videos/vargas.tsx) */}
      <div style={{position: 'fixed', inset: 0, zIndex: 1}}>
        <Canvas camera={{fov: 44, near: 0.5, far: 400, position: [0, 5.8, 21]}} gl={{antialias: true, alpha: true}}>
          <AnimadorPalco alvo={alvoPalco} />
        </Canvas>
      </div>

      {/* HUD Superior */}
      <header
        style={{
          position: 'fixed',
          top: 14,
          left: 16,
          right: 16,
          zIndex: 10,
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 14,
          flexWrap: 'wrap',
          pointerEvents: 'none',
        }}
      >
        <AvatarSeLigaHud
          falando={falando}
          fala={falaAtual}
          audioLigado={audioLigado}
          onToggleAudio={() => {
            setAudioLigado((prev) => {
              const novo = !prev;
              if (!novo) pararAudio();
              return novo;
            });
          }}
          temAudio={faseTela === 'dilema' && Boolean(atoAtual.audio)}
          onReplayAudio={() => tocarAudio(atoAtual.audio)}
        />

        {faseTela !== 'inicio' && (
          <MedidoresPilares
            pilares={pilares}
            valores={valores}
            previewEfeitos={previewAtual}
            ultimosDeltas={faseTela === 'resultado' ? ultimosDeltas : null}
          />
        )}

        <div style={{display: 'flex', alignItems: 'center', gap: 10, pointerEvents: 'auto'}}>
          <div style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6}}>
            <div
              style={{
                background: 'linear-gradient(90deg, #4a1278, #2b0948)',
                color: '#ffd000',
                fontWeight: 900,
                fontSize: 12,
                padding: '5px 12px',
                borderRadius: 9,
                border: '2px solid #ffd000',
                boxShadow: '4px 4px 0 #ff6b00',
              }}
            >
              {faseTela === 'inicio'
                ? 'SÉRIE: TODOS OS PRESIDENTES'
                : faseTela === 'fim'
                  ? `FIM · ${historicoLog.length}/${atos.length} ATOS`
                  : `ATO ${atoIdx + 1}/${atos.length} · ${atoAtual.ano}`}
            </div>

            <div style={{display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: 'flex-end'}}>
              <button
                type="button"
                onClick={() => setEspiarPalco((v) => !v)}
                style={{
                  background: espiarPalco ? '#ffd000' : 'rgba(18, 7, 31, 0.85)',
                  color: espiarPalco ? '#1a082e' : '#ffffff',
                  border: '2px solid #ffd000',
                  borderRadius: 8,
                  padding: '4px 9px',
                  fontWeight: 900,
                  fontSize: 11,
                  cursor: 'pointer',
                }}
              >
                {espiarPalco ? '🃏 Mostrar Card' : '👁️ Ver Palco 3D'}
              </button>

              <button
                type="button"
                onClick={() =>
                  setCameraOverride((cur) => {
                    const idx = CAMERA_OPCOES.findIndex((x) => x.id === cur);
                    return CAMERA_OPCOES[(idx + 1) % CAMERA_OPCOES.length].id;
                  })
                }
                title="Trocar câmera (atalho C)"
                style={{
                  background: 'rgba(18, 7, 31, 0.85)',
                  color: '#ffd000',
                  border: '2px solid rgba(255, 208, 0, 0.65)',
                  borderRadius: 8,
                  padding: '4px 9px',
                  fontWeight: 800,
                  fontSize: 11,
                  cursor: 'pointer',
                }}
              >
                🎥 Câm: {CAMERA_OPCOES.find((c) => c.id === cameraOverride)?.label}
              </button>
            </div>
          </div>

          <LogoSeLiga size={66} />
        </div>
      </header>

      {/* Container de Cartas Teatrais (Scoped View Transitions) */}
      {!espiarPalco && (
        <main
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 8,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            alignItems: 'center',
            padding: '12px 16px 14px',
            pointerEvents: 'none',
          }}
        >
          <div ref={cardScopeRef} className="card-scope" style={{width: 'min(760px, 100%)', pointerEvents: 'auto'}}>
            <div className="card-panel">
              {faseTela === 'inicio' && (
                <section
                  style={{
                    background: 'linear-gradient(135deg, rgba(74, 18, 120, 0.96) 0%, rgba(32, 8, 56, 0.97) 100%)',
                    border: '4px solid #ffd000',
                    borderRadius: 22,
                    padding: '22px 26px',
                    boxShadow: '10px 10px 0 #ff6b00, 0 20px 50px rgba(0,0,0,0.75)',
                    textAlign: 'center',
                  }}
                >
                  <div
                    style={{
                      display: 'inline-block',
                      background: '#ffd000',
                      color: '#1a082e',
                      fontWeight: 900,
                      fontSize: 12,
                      padding: '4px 12px',
                      borderRadius: 8,
                      letterSpacing: 1,
                    }}
                  >
                    JOGO INTERATIVO 3D · 1930–1945
                  </div>
                  <h1 style={{margin: '10px 0 8px', fontSize: 'clamp(26px, 4vw, 38px)', fontWeight: 900, lineHeight: 1.05}}>
                    GETÚLIO VARGAS: <span style={{color: '#ffd000'}}>O EQUILIBRISTA</span>
                  </h1>
                  <p style={{margin: '0 auto 16px', maxWidth: 600, fontSize: 14, color: '#efe5ff', lineHeight: 1.45}}>
                    Tome as 12 grandes decisões da Era Vargas no palco do Palácio do Catete. Mantenha{' '}
                    <strong>Exército</strong>, <strong>Povo</strong>, <strong>Elite &amp; Café</strong> e{' '}
                    <strong>Controle</strong> entre <strong>1% e 99%</strong> — se qualquer pilar zerar ou estourar em
                    100%, você leva um golpe!
                  </p>
                  <div style={{display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap'}}>
                    <button
                      ref={btnIniciarRef}
                      type="button"
                      onClick={iniciarJogo}
                      style={{
                        background: 'linear-gradient(90deg, #ff8a00, #ff1e56)',
                        color: '#ffffff',
                        border: '3px solid #ffd000',
                        borderRadius: 14,
                        padding: '13px 28px',
                        fontSize: 17,
                        fontWeight: 900,
                        letterSpacing: 0.6,
                        cursor: 'pointer',
                        boxShadow: '6px 6px 0 #1a082e',
                      }}
                    >
                      ENTRAR NO PALCO (1930) ▶
                    </button>
                  </div>
                  <div style={{marginTop: 10, fontSize: 12, color: '#d4beff', fontWeight: 700}}>
                    Atalhos: ← / → escolher · Enter avançar · C câmera 3D
                  </div>
                  <DisclaimerHomenagem textAlign="left" />
                </section>
              )}

              {faseTela === 'dilema' && (
                <section
                  style={{
                    background: 'linear-gradient(135deg, rgba(58, 13, 94, 0.94) 0%, rgba(23, 6, 42, 0.96) 100%)',
                    border: '4px solid #ffd000',
                    borderRadius: 20,
                    padding: '14px 19px',
                    boxShadow: '9px 9px 0 #ff6b00, 0 20px 50px rgba(0,0,0,0.75)',
                  }}
                >
                  <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap'}}>
                    <span
                      style={{
                        background: '#ffd000',
                        color: '#1a082e',
                        fontWeight: 900,
                        fontSize: 12,
                        padding: '4px 12px',
                        borderRadius: 8,
                      }}
                    >
                      {atoAtual.epoca}
                    </span>
                    <span style={{fontSize: 12, color: '#d8c2ff', fontWeight: 800}}>
                      Passe o mouse para prever impacto nos pilares
                    </span>
                  </div>

                  <h2 style={{margin: '10px 0 6px', fontSize: 'clamp(20px, 3vw, 27px)', fontWeight: 900, color: '#ffffff'}}>
                    {atoAtual.titulo}
                  </h2>
                  <p style={{margin: '0 0 14px', fontSize: 15, lineHeight: 1.45, color: '#f3eaff', fontWeight: 700}}>
                    {atoAtual.pergunta}
                  </p>

                  <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12}}>
                    {atoAtual.opcoes.map((op, idx) => (
                      <button
                        key={idx}
                        ref={idx === 0 ? btnOpcao0Ref : undefined}
                        type="button"
                        onClick={() => escolherOpcao(op)}
                        onMouseEnter={() => setHoverOpcao(idx)}
                        onMouseLeave={() => setHoverOpcao(null)}
                        onFocus={() => setHoverOpcao(idx)}
                        onBlur={() => setHoverOpcao(null)}
                        style={{
                          textAlign: 'left',
                          background: hoverOpcao === idx ? '#ffd000' : 'rgba(255, 255, 255, 0.1)',
                          color: hoverOpcao === idx ? '#1a082e' : '#ffffff',
                          border: '3px solid #ffd000',
                          borderRadius: 14,
                          padding: '12px 15px',
                          cursor: 'pointer',
                          transition: 'background-color 140ms ease, transform 140ms ease',
                          transform: hoverOpcao === idx ? 'translateY(-2px)' : 'none',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 10,
                        }}
                      >
                        <div>
                          <div style={{fontSize: 11, fontWeight: 900, opacity: 0.78, marginBottom: 3}}>
                            {idx === 0 ? '← OPÇÃO 1' : 'OPÇÃO 2 →'}
                          </div>
                          <div style={{fontSize: 14, fontWeight: 900, lineHeight: 1.3}}>{op.texto}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </section>
              )}

              {faseTela === 'resultado' && opcaoEscolhida && (
                <section
                  style={{
                    position: 'relative',
                    background: 'linear-gradient(135deg, rgba(46, 11, 76, 0.96) 0%, rgba(19, 5, 36, 0.97) 100%)',
                    border: `4px solid ${quedaMotivo ? '#ff2d55' : '#ffd000'}`,
                    borderRadius: 20,
                    padding: '14px 19px',
                    boxShadow: `9px 9px 0 ${quedaMotivo ? '#ff2d55' : '#ff6b00'}, 0 20px 50px rgba(0,0,0,0.8)`,
                  }}
                >
                  {/* Carimbo Teatral batendo na tela */}
                  <div
                    className="carimbo-anim"
                    style={{
                      position: 'absolute',
                      top: -18,
                      right: 16,
                      border: '4px solid #e62429',
                      background: '#fff3e0',
                      color: '#c8201a',
                      borderRadius: 12,
                      padding: '4px 14px',
                      fontWeight: 900,
                      fontSize: 18,
                      letterSpacing: 1,
                      boxShadow: '0 6px 20px rgba(0,0,0,0.45)',
                    }}
                  >
                    {quedaMotivo ? quedaMotivo.carimbo : opcaoEscolhida.carimbo}
                  </div>

                  <div
                    style={{
                      display: 'inline-block',
                      background: opcaoEscolhida.historico ? '#3df28f' : '#ff9e00',
                      color: '#140822',
                      fontWeight: 900,
                      fontSize: 12,
                      padding: '4px 12px',
                      borderRadius: 8,
                    }}
                  >
                    {opcaoEscolhida.historico ? '✓ CAMINHO HISTÓRICO DE VARGAS' : '⚡ HISTÓRIA ALTERNATIVA ("E SE...")'}
                  </div>

                  <h3 style={{margin: '10px 0 6px', fontSize: 21, fontWeight: 900, color: quedaMotivo ? '#ff5c7c' : '#ffd000'}}>
                    {quedaMotivo ? quedaMotivo.titulo : atoAtual.titulo}
                  </h3>
                  <p style={{margin: '0 0 12px', fontSize: 14, lineHeight: 1.45, color: '#ffffff', fontWeight: 700}}>
                    {quedaMotivo ? quedaMotivo.texto : opcaoEscolhida.resultado}
                  </p>

                  {/* Deltas numéricos */}
                  <div style={{display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14}}>
                    {pilares.map((p) => {
                      const d = opcaoEscolhida.efeitos[p.id as PilarId] ?? 0;
                      if (d === 0) return null;
                      return (
                        <span
                          key={p.id}
                          style={{
                            background: d > 0 ? 'rgba(61, 242, 143, 0.16)' : 'rgba(255, 56, 76, 0.18)',
                            border: `1px solid ${d > 0 ? '#3df28f' : '#ff384c'}`,
                            color: d > 0 ? '#3df28f' : '#ff6b81',
                            fontWeight: 900,
                            fontSize: 12,
                            padding: '4px 10px',
                            borderRadius: 99,
                          }}
                        >
                          {p.icone} {p.nome}: {d > 0 ? `+${d}` : d}
                        </span>
                      );
                    })}
                  </div>

                  <button
                    ref={btnProximoRef}
                    type="button"
                    onClick={avancarProximo}
                    style={{
                      width: '100%',
                      background: quedaMotivo
                        ? 'linear-gradient(90deg, #ff2d55, #ff6b00)'
                        : 'linear-gradient(90deg, #ffd000, #ff8a00)',
                      color: quedaMotivo ? '#ffffff' : '#1a082e',
                      border: 'none',
                      borderRadius: 12,
                      padding: '12px 20px',
                      fontSize: 15,
                      fontWeight: 900,
                      cursor: 'pointer',
                    }}
                  >
                    {quedaMotivo || atoIdx >= atos.length - 1
                      ? 'VER VEREDITO FINAL ▶'
                      : `AVANÇAR PARA ${atos[atoIdx + 1].ano} ▶`}
                  </button>
                </section>
              )}

              {faseTela === 'fim' && (
                <section
                  style={{
                    background: 'linear-gradient(135deg, rgba(56, 12, 92, 0.96) 0%, rgba(20, 5, 36, 0.98) 100%)',
                    border: `4px solid ${quedaMotivo ? '#ff2d55' : '#3df28f'}`,
                    borderRadius: 22,
                    padding: '20px 24px',
                    boxShadow: '10px 10px 0 #ff6b00, 0 20px 50px rgba(0,0,0,0.85)',
                  }}
                >
                  <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10}}>
                    <span
                      style={{
                        background: quedaMotivo ? '#ff2d55' : '#3df28f',
                        color: quedaMotivo ? '#ffffff' : '#120820',
                        fontWeight: 900,
                        fontSize: 12,
                        padding: '4px 12px',
                        borderRadius: 8,
                      }}
                    >
                      {quedaMotivo
                        ? `DEPOSTO NO ATO ${historicoLog.length}/${atos.length}`
                        : `SOBREVIVEU AOS 15 ANOS (1930–1945)!`}
                    </span>
                    <span style={{fontSize: 13, fontWeight: 900, color: '#ffd000'}}>
                      Fidelidade Histórica: {acertosHistoricos}/{atos.length}
                    </span>
                  </div>

                  <h2 style={{margin: '10px 0 8px', fontSize: 'clamp(22px, 3.2vw, 30px)', fontWeight: 900, color: '#ffd000'}}>
                    {tituloVeredito}
                  </h2>

                  <div
                    style={{
                      maxHeight: 130,
                      overflowY: 'auto',
                      background: 'rgba(0,0,0,0.3)',
                      borderRadius: 12,
                      padding: '8px 12px',
                      marginBottom: 14,
                      display: 'grid',
                      gap: 5,
                      fontSize: 12,
                    }}
                  >
                    {historicoLog.map((item, k) => (
                      <div key={k} style={{display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center'}}>
                        <span>
                          <strong style={{color: '#ffd000'}}>{item.ano}</strong> · {item.titulo}
                        </span>
                        <span style={{color: item.historico ? '#3df28f' : '#ffae42', fontWeight: 800, whiteSpace: 'nowrap'}}>
                          {item.carimbo}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div style={{display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between'}}>
                    <a
                      href="https://seliga.com.br"
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        background: '#ffd000',
                        color: '#1a082e',
                        textDecoration: 'none',
                        fontWeight: 900,
                        fontSize: 13,
                        padding: '10px 16px',
                        borderRadius: 12,
                      }}
                    >
                      🎓 Curso Completo em seliga.com.br ↗
                    </a>

                    <button
                      type="button"
                      onClick={iniciarJogo}
                      style={{
                        background: 'linear-gradient(90deg, #ff8a00, #ff1e56)',
                        color: '#ffffff',
                        border: '3px solid #ffd000',
                        borderRadius: 12,
                        padding: '10px 22px',
                        fontSize: 15,
                        fontWeight: 900,
                        cursor: 'pointer',
                      }}
                    >
                      JOGAR NOVAMENTE ↻
                    </button>
                  </div>

                  <DisclaimerHomenagem textAlign="left" />
                </section>
              )}
            </div>
          </div>
          {(faseTela === 'dilema' || faseTela === 'resultado') && (
            <div
              style={{
                marginTop: 4,
                fontSize: 10,
                color: 'rgba(235, 224, 255, 0.72)',
                textAlign: 'center',
                textShadow: '0 1px 4px rgba(0,0,0,0.85)',
              }}
            >
              Homenagem de fã sem vínculo oficial com o Se Liga · Eventuais erros históricos ou simplificações são do autor do jogo.
            </div>
          )}
        </main>
      )}
    </div>
  );
};

const rootEl = document.getElementById('root')!;
createRoot(rootEl).render(<AppJogoVargas />);
