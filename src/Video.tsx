import React, {useEffect, useState} from 'react';
import {AbsoluteFill, Audio, Sequence, continueRender, delayRender, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import '@fontsource/montserrat/800.css';
import '@fontsource/montserrat/900.css';
import {starField} from './World';
import {cenaNoFrame} from './timeline';
import {MUNDOS} from './mundos';
import {Apresentador} from './core/Apresentador';
import {TEMAS, Tema} from './core/temas';

const VERDE = '#3df28f';

// Texto com *destaque* -> spans coloridos, entrando palavra por palavra
const Titulo: React.FC<{texto: string; destaque: string; tema: Tema}> = ({texto, destaque, tema}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const tokens: {w: string; hi: boolean}[] = [];
  texto.split(/(\*[^*]+\*)/).forEach((parte) => {
    const hi = parte.startsWith('*');
    (hi ? [parte.replace(/\*/g, '')] : parte.split(/\s+/)).filter(Boolean).forEach((w) => {
      // pontuação solta gruda na palavra anterior (evita "?" sozinho na linha)
      if (/^[?!.,:;]+$/.test(w) && tokens.length) tokens[tokens.length - 1].w += w;
      else tokens.push({w, hi});
    });
  });
  return (
    <div style={{position: 'absolute', top: 400, left: 60, right: 60, display: 'flex', justifyContent: 'center'}}>
    <div style={{
      textAlign: 'center', fontFamily: tema.fonte, fontWeight: tema.peso, lineHeight: 1.08,
      ...tema.titulo, ...(tema.caixaTitulo ?? {}),
      opacity: tema.caixaTitulo ? Math.min(1, frame / 6) : 1,
    }}>
      {tokens.map((t, i) => {
        const s = spring({frame: frame - i * 2.5, fps, config: {damping: 14, stiffness: 180}});
        return (
          <span key={i} style={{
            display: 'inline-block', whiteSpace: 'nowrap', marginRight: 22, color: t.hi ? destaque : (tema.titulo.color ?? 'white'),
            transform: `translateY(${(1 - s) * 40}px) scale(${0.7 + 0.3 * s})`, opacity: s,
            textShadow: t.hi && !tema.caixaTitulo ? `0 0 26px ${destaque}88, 0 6px 18px rgba(0,0,0,0.75)` : undefined,
          }}>{t.w}</span>
        );
      })}
    </div>
    </div>
  );
};

// Legenda tipo karaokê: mostra o bloco atual da narração e acende a palavra falada.
const Legenda: React.FC<{blocos: any[]; tema: Tema}> = ({blocos, tema}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const i = blocos.findIndex((b: any, k: number) => t >= b.ini && (k === blocos.length - 1 ? t < b.fim + 0.6 : t < blocos[k + 1].ini));
  if (i < 0) return null;
  const b = blocos[i];
  const entra = Math.min(1, (t - b.ini) * 8);
  return (
    <div style={{position: 'absolute', top: 1665, left: 40, right: 40, display: 'flex', justifyContent: 'center'}}>
      <div style={{
        padding: '18px 30px', maxWidth: 940, textAlign: 'center', fontSize: 50, lineHeight: 1.2,
        ...tema.legenda, translate: `0 ${(1 - entra) * 14}px`, opacity: 0.4 + 0.6 * entra,
      }}>
        {b.palavras.map((p: any, k: number) => {
          const atual = t >= p.ini && (k === b.palavras.length - 1 || t < b.palavras[k + 1].ini);
          const dita = t >= p.ini;
          return (
            <span key={k} style={{
              color: atual ? tema.legendaAtual : dita ? tema.legendaDita : tema.legendaFutura,
              display: 'inline-block', margin: '0 9px', transform: `scale(${atual ? 1.06 : 1})`,
            }}>{p.w}</span>
          );
        })}
      </div>
    </div>
  );
};

// Carimbo vermelho que bate na tela
const Carimbo: React.FC<{texto: string}> = ({texto}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const s = spring({frame: frame - 18, fps, config: {damping: 11, stiffness: 220}});
  if (frame < 18) return null;
  return (
    <div style={{position: 'absolute', top: 1060, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
      <div style={{
        border: '12px solid #c8201a', color: '#c8201a', borderRadius: 18, padding: '10px 40px',
        fontFamily: 'Montserrat', fontWeight: 900, fontSize: 120, letterSpacing: 4, background: 'rgba(255,240,220,0.18)',
        transform: `rotate(-12deg) scale(${2.4 - 1.4 * s})`, opacity: Math.min(1, s * 1.5),
        boxShadow: '0 0 0 6px rgba(200,32,26,0.25)', mixBlendMode: 'multiply',
      }}>{texto}</div>
    </div>
  );
};

// Placar esportivo no topo: o número vira quando muda em relação à cena anterior
const Placar: React.FC<{cenas: any[]; i: number; local: number}> = ({cenas, i, local}) => {
  const c = cenas[i];
  const ant = i > 0 && cenas[i - 1].placar ? cenas[i - 1].placar : [0, 0];
  const virada = Math.round(c.frames * 0.72);
  const mostra = local >= virada ? c.placar : ant;
  const pulso = (k: number) => (c.placar[k] !== ant[k] && local >= virada ? Math.max(0, 1 - (local - virada) / 18) : 0);
  const casa = (txt: string, cor: string) => (
    <div style={{flex: 1, background: cor, color: '#fff', fontFamily: 'Anton', fontSize: 40, padding: '10px 14px', textAlign: 'center', letterSpacing: 1}}>{txt}</div>
  );
  const num = (k: number) => (
    <div style={{width: 92, background: '#12081f', color: '#ffe600', fontFamily: 'Anton', fontSize: 64, textAlign: 'center', lineHeight: '86px',
      transform: `scale(${1 + 0.35 * pulso(k)})`, textShadow: `0 0 ${30 * pulso(k)}px #ffe600`}}>{mostra[k]}</div>
  );
  return (
    <div style={{position: 'absolute', top: 110, left: 340, right: 36}}>
      <div style={{display: 'flex', alignItems: 'stretch', transform: 'skewX(-8deg)', boxShadow: '8px 8px 0 #ff2d8a', border: '4px solid #ffe600'}}>
        {casa('PORTUGUESES', '#b3192e')}{num(0)}<div style={{width: 4, background: '#ffe600'}} />{num(1)}{casa('INDÍGENAS', '#1f7a3a')}
      </div>
      {c.rodadaTxt && (
        <div style={{marginTop: 14, marginLeft: 30, display: 'inline-block', background: '#ff2d8a', color: '#fff', fontFamily: 'Anton', fontSize: 34,
          padding: '4px 18px', transform: 'skewX(-8deg)', letterSpacing: 2}}>{c.rodadaTxt}</div>
      )}
    </div>
  );
};

const Caixa: React.FC<{titulo: string; sub: string; vis: number}> = ({titulo, sub, vis}) => {
  if (vis <= 0.01) return null;
  return (
    <div style={{
      position: 'absolute', top: 1760 - 0, left: 120, right: 120, transform: `translateY(-100%) scale(${0.85 + 0.15 * vis})`,
      opacity: vis, border: '4px solid #3dd6f5', borderRadius: 18, background: 'rgba(6,18,30,0.82)',
      boxShadow: '0 0 30px #3dd6f566, inset 0 0 20px #3dd6f522', padding: '22px 20px 18px', textAlign: 'center',
      fontFamily: 'Montserrat', color: '#3dd6f5',
    }}>
      <div style={{fontWeight: 900, fontSize: 64, letterSpacing: -1}}>
        {titulo.split('→').map((p, k) => (
          <React.Fragment key={k}>
            {k > 0 && (
              <svg width="56" height="40" viewBox="0 0 56 40" style={{margin: '0 14px', verticalAlign: 'middle'}}>
                <path d="M4 20 H44 M30 6 L46 20 L30 34" stroke="#3dd6f5" strokeWidth="8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
            {p.trim()}
          </React.Fragment>
        ))}
      </div>
      <div style={{fontWeight: 800, fontSize: 34, color: '#e8f4ff', marginTop: 4}}>{sub}</div>
    </div>
  );
};

const Ceu: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{background: 'linear-gradient(#060a16 0%, #0c1426 35%, #18233a 55%, #141d31 70%)'}}>
      {starField.map((s, i) => (
        <div key={i} style={{
          position: 'absolute', left: `${s.x}%`, top: `${s.y}%`, width: s.s, height: s.s, borderRadius: '50%',
          background: 'white', opacity: s.a * (0.75 + 0.25 * Math.sin(frame / 12 + s.p)),
        }} />
      ))}
    </AbsoluteFill>
  );
};

// Logo circular Se Liga (círculo amarelo, borda rosa-laranja, "Se" preto, "Liga" branco + raios acima do "a")
export const LogoSeLiga: React.FC<{size?: number}> = ({size = 116}) => {
  const pad = Math.max(4, Math.round(size * 0.04));
  const fs = Math.round(size * 0.28);
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', padding: pad, flexShrink: 0,
      background: 'linear-gradient(135deg, #ff1e56 0%, #ff8a00 100%)',
      boxShadow: '0 10px 28px rgba(0,0,0,0.55)',
    }}>
      <div style={{
        position: 'relative', width: '100%', height: '100%', borderRadius: '50%', background: '#ffd000',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'Montserrat', fontWeight: 900, letterSpacing: -size * 0.015,
      }}>
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

// Cabeçalho superior direito no tema Se Liga: série + época atual + logo
const TopoSeLiga: React.FC<{cena: any}> = ({cena}) => (
  <div style={{
    position: 'absolute', top: 64, left: 336, right: 36, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
  }}>
    <div style={{display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'flex-start'}}>
      <div style={{
        background: 'linear-gradient(90deg, #4a1278, #2b0948)', color: '#ffd000', fontFamily: 'Montserrat', fontWeight: 900,
        fontSize: 25, padding: '8px 18px', borderRadius: 10, border: '3px solid #ffd000',
        transform: 'rotate(-1.5deg)', boxShadow: '6px 6px 0 #ff6b00', letterSpacing: 0.4,
      }}>
        SÉRIE: TODOS OS PRESIDENTES
      </div>
      {cena.epoca && (
        <div style={{
          background: '#ffd000', color: '#1a082e', fontFamily: 'Montserrat', fontWeight: 900,
          fontSize: 27, padding: '7px 18px', borderRadius: 10, border: '3px solid #1a082e',
          boxShadow: '5px 5px 0 #4a1278', letterSpacing: 0.5,
        }}>
          {cena.epoca}
        </div>
      )}
    </div>
    <LogoSeLiga size={116} />
  </div>
);

// Selo central animado com a logo do Se Liga na abertura
const IntroLogoSeLiga: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const s = spring({frame, fps, config: {damping: 12, stiffness: 170}});
  return (
    <div style={{
      position: 'absolute', top: 1265, left: 60, right: 60, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
      transform: `scale(${0.65 + 0.35 * s})`, opacity: s,
    }}>
      <LogoSeLiga size={200} />
      <div style={{
        background: 'linear-gradient(90deg, #ff6b00, #ff1e56)', color: '#ffffff', fontFamily: 'Montserrat', fontWeight: 900,
        fontSize: 34, padding: '10px 28px', borderRadius: 14, border: '4px solid #ffd000',
        boxShadow: '8px 8px 0 #1a082e', letterSpacing: 1, textTransform: 'uppercase',
      }}>
        APRESENTA: ERA VARGAS
      </div>
    </div>
  );
};

// Card final chamando pro vídeo completo no YouTube + seliga.com.br
const CtaSeLiga: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const s = spring({frame: frame - 4, fps, config: {damping: 13, stiffness: 180}});
  return (
    <div style={{position: 'absolute', top: 1310, left: 80, right: 80, display: 'flex', justifyContent: 'center'}}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 24, width: '100%', padding: '22px 28px',
        background: 'linear-gradient(135deg, #4a1278 0%, #24073d 100%)', borderRadius: 22,
        border: '4px solid #ffd000', boxShadow: '10px 10px 0 #ff6b00, 0 18px 40px rgba(0,0,0,0.75)',
        transform: `translateY(${(1 - s) * 40}px) scale(${0.85 + 0.15 * s})`, opacity: s,
      }}>
        <LogoSeLiga size={130} />
        <div style={{display: 'flex', flexDirection: 'column', gap: 8, fontFamily: 'Montserrat'}}>
          <div style={{color: '#ffffff', fontWeight: 900, fontSize: 34, lineHeight: 1.12, textTransform: 'uppercase'}}>
            ASSISTA AO VÍDEO COMPLETO NO YOUTUBE
          </div>
          <div style={{
            display: 'inline-block', alignSelf: 'flex-start', background: '#ffd000', color: '#1a082e',
            fontWeight: 900, fontSize: 30, padding: '6px 16px', borderRadius: 10, letterSpacing: 0.5,
          }}>
            ACESSE SELIGA.COM.BR
          </div>
        </div>
      </div>
    </div>
  );
};

export const Video: React.FC<any> = (props) => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();
  const tema = TEMAS[props.tema ?? 'neon'];
  const CeuT = tema.Ceu ?? Ceu;
  const [handle] = useState(() => delayRender('fontes'));
  const [pronto, setPronto] = useState(false);
  useEffect(() => {
    Promise.all(tema.fontesCarregar.map((f) => document.fonts.load(f))).then(() => {
      setPronto(true);
      continueRender(handle);
    });
  }, [handle]);

  const {i} = cenaNoFrame(props.cenas, frame);
  const mundo = MUNDOS[props.tipo ?? 'estrada'];
  const st: any = mundo.estado(props, frame);
  const World = mundo.World;
  let inicio = 0;
  const seqs = props.cenas.map((c: any) => {
    const s = {c, from: inicio};
    inicio += c.frames;
    return s;
  });
  const caixaCena = props.cenas.slice(0, i + 1).reverse().find((c: any) => c.caixa)?.caixa;
  const fadeOut = interpolate(frame, [inicio - 20, inicio - 1], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const nomeApresentador = props.apresentadorNome ?? (props.tema === 'seliga' ? 'SE LIGA' : 'PROF. SANTA');

  return (
    <AbsoluteFill style={{backgroundColor: '#000'}}>
      <AbsoluteFill style={{opacity: fadeOut}}>
        <CeuT />
        {pronto && (
          <ThreeCanvas width={width} height={height} camera={{fov: 44, near: 0.5, far: 400}} gl={{antialias: true, alpha: true}}>
            <World props={props} />
          </ThreeCanvas>
        )}
        {/* faixa do rodapé para a legenda */}
        {props.tipo && props.tipo !== 'estrada' && tema.rodape && <AbsoluteFill style={{background: tema.rodape}} />}
        {/* vinheta */}
        {tema.vinheta && <AbsoluteFill style={{background: tema.vinheta}} />}
        {pronto && props.tipo !== 'estrada' && props.apresentador !== false && (
          <Apresentador cenas={props.cenas} nome={nomeApresentador} tema={tema} />
        )}
        {props.tema === 'seliga' && <TopoSeLiga cena={props.cenas[i]} />}
        {props.cenas[i].placar && <Placar cenas={props.cenas} i={i} local={cenaNoFrame(props.cenas, frame).local} />}
        {caixaCena && <Caixa titulo={caixaCena.titulo} sub={caixaCena.sub} vis={st.caixa} />}
        {seqs.map(({c, from}: any) => (
          <Sequence key={c.id} from={from} durationInFrames={c.frames} layout="none">
            <Titulo texto={c.texto} destaque={c.destaque ?? tema.destaque ?? VERDE} tema={tema} />
            {c.logoIntro && <IntroLogoSeLiga />}
            {c.ctaFinal && <CtaSeLiga />}
            {c.carimbo && <Carimbo texto={c.carimbo} />}
            {c.legenda?.length > 0 && props.legendas !== false && <Legenda blocos={c.legenda} tema={tema} />}
          </Sequence>
        ))}
      </AbsoluteFill>
      {seqs.map(({c, from}: any) =>
        c.audio ? (
          <Sequence key={`a-${c.id}`} from={from} durationInFrames={c.frames}>
            <Audio src={staticFile(c.audio)} />
          </Sequence>
        ) : null,
      )}
      {props.musica && <Audio src={staticFile(props.musica)} volume={0.12} loop />}
    </AbsoluteFill>
  );
};
