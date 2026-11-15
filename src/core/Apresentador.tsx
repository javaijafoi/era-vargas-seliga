// Apresentador low poly no canto: cabeça falando, com a boca seguindo o volume da narração.
import React from 'react';
import {ThreeCanvas} from '@remotion/three';
import {useCurrentFrame} from 'remotion';
import {cenaNoFrame} from './mix';

const PELE = '#e6b08c';
const BARBA = '#ece7df';
const CABELO = '#cfc9bf';
const CAMISA = '#2f6fdf';

export const Cabeca: React.FC<{boca: number; frame: number}> = ({boca, frame}) => {
  const t = frame / 30;
  const piscando = frame % 97 < 4;
  const olhoY = piscando ? 0.12 : 1;
  const sobrancelha = 0.36 + boca * 0.05;
  return (
    <group rotation={[-0.04 + boca * 0.07 + Math.sin(t * 0.9) * 0.03, Math.sin(t * 0.6) * 0.16, Math.sin(t * 0.45) * 0.05]}>
      {/* corpo / ombros */}
      <mesh position={[0, -1.95, -0.1]}>
        <cylinderGeometry args={[0.85, 1.45, 1.3, 7]} />
        <meshStandardMaterial color={CAMISA} flatShading />
      </mesh>
      <mesh position={[0, -1.33, 0.2]} rotation-x={0.25}>
        <cylinderGeometry args={[0.42, 0.5, 0.3, 6]} />
        <meshStandardMaterial color={PELE} flatShading />
      </mesh>
      {/* cabeça */}
      <mesh scale={[0.9, 1.05, 0.95]}>
        <icosahedronGeometry args={[1, 1]} />
        <meshStandardMaterial color={PELE} flatShading />
      </mesh>
      {/* cabelo (laterais e topo) */}
      <mesh position={[0, 0.38, -0.12]} scale={[0.96, 0.62, 0.98]}>
        <icosahedronGeometry args={[1, 1]} />
        <meshStandardMaterial color={CABELO} flatShading />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.88, 0.02, 0]} scale={[0.25, 0.32, 0.22]}>
          <icosahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color={PELE} flatShading />
        </mesh>
      ))}
      {/* olhos */}
      {[-1, 1].map((s) => (
        <group key={s} position={[s * 0.32, 0.1, 0.82]} scale={[1, olhoY, 1]}>
          <mesh>
            <icosahedronGeometry args={[0.14, 1]} />
            <meshStandardMaterial color="#ffffff" />
          </mesh>
          <mesh position-z={0.1}>
            <icosahedronGeometry args={[0.07, 1]} />
            <meshStandardMaterial color="#1b1410" />
          </mesh>
        </group>
      ))}
      {/* óculos */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.32, 0.1, 0.95]}>
          <torusGeometry args={[0.21, 0.03, 4, 14]} />
          <meshStandardMaterial color="#20232a" />
        </mesh>
      ))}
      <mesh position={[0, 0.13, 0.98]}>
        <boxGeometry args={[0.2, 0.04, 0.04]} />
        <meshStandardMaterial color="#20232a" />
      </mesh>
      {/* sobrancelhas */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.32, sobrancelha, 0.9]} rotation-z={s * -0.12}>
          <boxGeometry args={[0.3, 0.07, 0.06]} />
          <meshStandardMaterial color={CABELO} />
        </mesh>
      ))}
      {/* nariz */}
      <mesh position={[0, -0.12, 1.0]} rotation-x={Math.PI / 2}>
        <coneGeometry args={[0.12, 0.3, 5]} />
        <meshStandardMaterial color="#d99b78" flatShading />
      </mesh>
      {/* barba: parte de cima fixa, queixo desce com a fala */}
      <mesh position={[0, -0.42, 0.3]} scale={[0.95, 0.5, 0.72]}>
        <icosahedronGeometry args={[1, 1]} />
        <meshStandardMaterial color={BARBA} flatShading />
      </mesh>
      <mesh position={[0, -0.78 - boca * 0.12, 0.32]} scale={[0.72, 0.45, 0.6]}>
        <icosahedronGeometry args={[1, 1]} />
        <meshStandardMaterial color={BARBA} flatShading />
      </mesh>
      {/* boca */}
      <mesh position={[0, -0.5 - boca * 0.05, 0.98]} scale={[0.24, 0.03 + boca * 0.17, 0.08]}>
        <icosahedronGeometry args={[1, 1]} />
        <meshStandardMaterial color="#5a1f1f" />
      </mesh>
      {/* bigode */}
      <mesh position={[0, -0.33, 1.0]} scale={[0.4, 0.1, 0.12]}>
        <icosahedronGeometry args={[1, 0]} />
        <meshStandardMaterial color={BARBA} flatShading />
      </mesh>
    </group>
  );
};

export const Apresentador: React.FC<{cenas: any[]; nome?: string; tema?: any}> = ({cenas, nome = 'PROF. SANTA', tema}) => {
  const ac = tema?.acento ?? '#3dd6f5';
  const frame = useCurrentFrame();
  const {i, local} = cenaNoFrame(cenas, frame);
  const env: number[] = cenas[i].boca ?? [];
  const boca = Math.min(1, ((env[local] ?? 0) * 0.6 + (env[local - 1] ?? 0) * 0.4) * 1.1);
  const S = 270;
  return (
    <div style={{position: 'absolute', top: 48, left: 36, width: S, height: S + 40}}>
      <div style={{
        width: S, height: S, borderRadius: '50%', overflow: 'hidden', border: `6px solid ${ac}`,
        boxShadow: `0 0 30px ${ac}88, inset 0 0 30px ${ac}33`,
        background: tema?.fundoApresentador ?? 'radial-gradient(circle at 50% 40%, #24365a 0%, #0f1a30 70%)',
      }}>
        <ThreeCanvas width={S} height={S} camera={{fov: 30, position: [0, -0.35, 5.6]}} gl={{antialias: true, alpha: true}}>
          <hemisphereLight args={['#dfe8ff', '#334', 1.1]} />
          <directionalLight position={[3, 4, 6]} intensity={1.6} />
          <directionalLight position={[-4, 1, 2]} intensity={0.5} color="#9fc0ff" />
          <group position={[0, -0.15, 0]}>
            <Cabeca boca={boca} frame={frame} />
          </group>
        </ThreeCanvas>
      </div>
      <div style={{
        position: 'absolute', bottom: 2, left: '50%', transform: 'translateX(-50%)', whiteSpace: 'nowrap',
        background: ac, color: tema?.acentoTexto ?? '#06121e', fontFamily: 'Montserrat', fontWeight: 900, fontSize: 26,
        padding: '5px 16px', borderRadius: 12, letterSpacing: 0.5,
      }}>{nome}</div>
    </div>
  );
};
