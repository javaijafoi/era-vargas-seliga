// Identidades visuais: cada vídeo escolhe um "tema" (céu, fonte do título, estilo da legenda, cor do apresentador).
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import '@fontsource/playfair-display/900.css';
import '@fontsource/playfair-display/700.css';
import '@fontsource/anton/400.css';

export type Tema = {
  fonte: string; peso: number; fontesCarregar: string[];
  titulo: React.CSSProperties; caixaTitulo?: React.CSSProperties; destaque: string;
  legenda: React.CSSProperties; legendaAtual: string; legendaDita: string; legendaFutura: string;
  acento: string; acentoTexto: string; fundoApresentador: string;
  rodape?: string; vinheta?: string;
  Ceu?: React.FC;
};

// Amanhecer na praia (céu quente com sol baixo)
const CeuAmanhecer: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{background: 'linear-gradient(#3b4a7a 0%, #8a6a9a 22%, #e98a6a 40%, #f7c27a 52%, #ffe2a8 58%)'}}>
      <div style={{
        position: 'absolute', left: 540 - 160, top: 880 - 160 - frame * 0.08, width: 320, height: 320, borderRadius: '50%',
        background: 'radial-gradient(circle, #fff6d8 0%, #ffd27a 55%, rgba(255,190,110,0) 72%)',
      }} />
    </AbsoluteFill>
  );
};

// Estádio à noite (placar esportivo)
const CeuEstadio: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{background: 'linear-gradient(#07040f 0%, #160b2c 40%, #2a1240 60%, #12081f 75%)'}}>
      {[160, 920].map((x, k) => (
        <div key={k} style={{
          position: 'absolute', left: x - 260, top: 380, width: 520, height: 520, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,255,240,0.55) 0%, rgba(255,255,220,0.12) 35%, rgba(0,0,0,0) 70%)',
          opacity: 0.85 + 0.15 * Math.sin(frame / 9 + k),
        }} />
      ))}
    </AbsoluteFill>
  );
};

// Palco teatral Se Liga: faixas verticais amarelo-laranja no topo, halftone, raios e transição escura pro palco 3D
const FAIXAS_SELIGA = ['#ffd400', '#ffba00', '#ff9e00', '#ff7b00', '#f05a00'];
const CeuSeLiga: React.FC = () => {
  const frame = useCurrentFrame();
  const pulso = 0.88 + 0.12 * Math.sin(frame / 14);
  return (
    <AbsoluteFill style={{background: '#090312', overflow: 'hidden'}}>
      <div style={{position: 'absolute', inset: 0, bottom: '45%', display: 'flex'}}>
        {FAIXAS_SELIGA.map((cor, idx) => (
          <div key={idx} style={{flex: 1, backgroundColor: cor}} />
        ))}
      </div>
      {/* halftone sutil no canto superior esquerdo */}
      <div
        style={{
          position: 'absolute', top: 0, left: 0, width: 460, height: 340, opacity: 0.22,
          backgroundImage: 'radial-gradient(#ffffff 3.5px, transparent 4px)',
          backgroundSize: '22px 22px',
          maskImage: 'radial-gradient(circle at 0% 0%, black 20%, transparent 78%)',
          WebkitMaskImage: 'radial-gradient(circle at 0% 0%, black 20%, transparent 78%)',
        }}
      />
      {/* marca d'água de raios solares */}
      <svg
        width="520"
        height="520"
        viewBox="0 0 200 200"
        style={{
          position: 'absolute', right: -70, top: 210, opacity: 0.18 * pulso,
          transform: `rotate(${Math.sin(frame / 45) * 4}deg)`,
        }}
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
      {/* transição para palco teatral escuro */}
      <AbsoluteFill
        style={{
          background: 'linear-gradient(180deg, rgba(18,7,31,0.12) 0%, rgba(18,7,31,0.72) 46%, #12071f 68%, #090312 100%)',
        }}
      />
    </AbsoluteFill>
  );
};

export const TEMAS: Record<string, Tema> = {
  neon: {
    fonte: 'Montserrat', peso: 900, fontesCarregar: ['900 80px Montserrat', '800 80px Montserrat'],
    titulo: {color: 'white', textShadow: '0 6px 18px rgba(0,0,0,0.75), 0 2px 3px rgba(0,0,0,0.9)', letterSpacing: -1, fontSize: 84},
    destaque: '#3df28f',
    legenda: {background: 'rgba(5,10,20,0.72)', borderRadius: 22, color: 'white', fontFamily: 'Montserrat', fontWeight: 800, boxShadow: '0 8px 30px rgba(0,0,0,0.45)'},
    legendaAtual: '#ffd23f', legendaDita: 'white', legendaFutura: 'rgba(255,255,255,0.55)',
    acento: '#3dd6f5', acentoTexto: '#06121e', fundoApresentador: 'radial-gradient(circle at 50% 40%, #24365a 0%, #0f1a30 70%)',
    rodape: 'linear-gradient(transparent 76%, rgba(4,8,16,0.85) 88%, rgba(4,8,16,0.95) 100%)',
    vinheta: 'radial-gradient(ellipse at 50% 55%, transparent 55%, rgba(0,0,0,0.55) 100%)',
  },
  // "livro didático": títulos em papel envelhecido, serifa, carimbo vermelho
  livro: {
    fonte: 'Playfair Display', peso: 900, fontesCarregar: ['900 80px "Playfair Display"', '700 80px "Playfair Display"', '900 80px Montserrat'],
    titulo: {color: '#2a1a0f', fontSize: 74, lineHeight: 1.12, letterSpacing: 0},
    caixaTitulo: {
      background: '#f4e7c8', borderRadius: 6, padding: '26px 30px 22px', transform: 'rotate(-1.6deg)',
      boxShadow: '0 14px 40px rgba(60,25,5,0.45), inset 0 0 40px rgba(150,100,40,0.25)', border: '3px solid #2a1a0f',
    },
    destaque: '#b3261e',
    legenda: {background: '#f4e7c8', borderRadius: 4, color: '#2a1a0f', fontFamily: '"Playfair Display"', fontWeight: 700, border: '3px solid #2a1a0f', boxShadow: '0 10px 30px rgba(40,15,0,0.5)'},
    legendaAtual: '#b3261e', legendaDita: '#2a1a0f', legendaFutura: 'rgba(42,26,15,0.45)',
    acento: '#b3261e', acentoTexto: '#f4e7c8', fundoApresentador: 'radial-gradient(circle at 50% 40%, #f7d9a8 0%, #d98a5a 75%)',
    vinheta: 'radial-gradient(ellipse at 50% 50%, transparent 60%, rgba(70,30,10,0.45) 100%)',
    Ceu: CeuAmanhecer,
  },
  // transmissão esportiva: fonte condensada, faixas inclinadas, amarelo/magenta
  placar: {
    fonte: 'Anton', peso: 400, fontesCarregar: ['400 80px Anton', '900 80px Montserrat', '800 80px Montserrat'],
    titulo: {color: 'white', fontSize: 96, lineHeight: 1.02, letterSpacing: 1, textTransform: 'uppercase'},
    caixaTitulo: {
      background: 'linear-gradient(90deg, #1a0b33, #3b0f5c)', padding: '18px 26px 14px', transform: 'skewX(-8deg)',
      borderLeft: '14px solid #ffe600', boxShadow: '0 12px 30px rgba(0,0,0,0.6)',
    },
    destaque: '#ffe600',
    legenda: {background: '#ffe600', borderRadius: 0, color: '#12081f', fontFamily: 'Montserrat', fontWeight: 900, transform: 'skewX(-8deg)', boxShadow: '8px 8px 0 #ff2d8a'},
    legendaAtual: '#ff2d8a', legendaDita: '#12081f', legendaFutura: 'rgba(18,8,31,0.45)',
    acento: '#ffe600', acentoTexto: '#12081f', fundoApresentador: 'radial-gradient(circle at 50% 40%, #4a1d7a 0%, #1a0b33 75%)',
    rodape: 'linear-gradient(transparent 80%, rgba(10,4,20,0.8) 100%)',
    vinheta: 'radial-gradient(ellipse at 50% 50%, transparent 55%, rgba(0,0,0,0.6) 100%)',
    Ceu: CeuEstadio,
  },
  // Se Liga: listras amarelo/laranja, caixa roxa inclinada, legenda de alto contraste
  seliga: {
    fonte: 'Montserrat',
    peso: 900,
    fontesCarregar: ['900 80px Montserrat', '800 80px Montserrat', '400 80px Anton'],
    titulo: {color: '#ffffff', fontSize: 72, lineHeight: 1.06, letterSpacing: -1, textTransform: 'uppercase'},
    caixaTitulo: {
      background: 'linear-gradient(135deg, #4a1278 0%, #2b0948 100%)',
      borderRadius: 16,
      padding: '20px 28px 18px',
      transform: 'rotate(-1.8deg)',
      border: '4px solid #ffd000',
      boxShadow: '10px 10px 0 #ff6b00, 0 16px 36px rgba(0,0,0,0.65)',
    },
    destaque: '#ffd000',
    legenda: {
      background: 'rgba(24, 8, 44, 0.94)',
      borderRadius: 18,
      color: '#ffffff',
      fontFamily: 'Montserrat',
      fontWeight: 900,
      border: '3px solid #ffd000',
      boxShadow: '6px 6px 0 #ff6b00, 0 10px 28px rgba(0,0,0,0.6)',
    },
    legendaAtual: '#ffd000',
    legendaDita: '#ffffff',
    legendaFutura: 'rgba(255,255,255,0.48)',
    acento: '#ffd000',
    acentoTexto: '#1a082e',
    fundoApresentador: 'radial-gradient(circle at 50% 40%, #ffae00 0%, #d45500 75%)',
    rodape: 'linear-gradient(transparent 75%, rgba(10,3,20,0.88) 90%, rgba(10,3,20,0.96) 100%)',
    vinheta: 'radial-gradient(ellipse at 50% 55%, transparent 58%, rgba(0,0,0,0.55) 100%)',
    Ceu: CeuSeLiga,
  },
};
