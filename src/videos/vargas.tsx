// Mundo 3D teatral da Era Vargas (1930-1945): palco com cortinas, Palácio do Catete e atos históricos.
import React from 'react';
import * as THREE from 'three';
import {useCurrentFrame} from 'remotion';
import {Label, rng} from '../components/Kit';
import {CameraRig} from '../core/CameraRig';
import {clamp01, estadoGenerico, lerp} from '../core/mix';

const CAMERAS: Record<string, {pos: number[]; look: number[]}> = {
  palco: {pos: [0, 5.8, 21], look: [0, 2.3, -2]},
  close: {pos: [0, 3.7, 13], look: [0, 2.6, -1]},
  alta: {pos: [0, 16.5, 19], look: [0, 1.2, -3]},
  esquerda: {pos: [-7.2, 5.0, 16.5], look: [0.8, 2.2, -2]},
  direita: {pos: [7.2, 5.0, 16.5], look: [-0.8, 2.2, -2]},
  palacio: {pos: [0, 2.9, 16.5], look: [0, 3.8, -5]},
};

export const CAMERAS_VARGAS = CAMERAS;

const addMat = {transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false} as const;

export const estadoVargas = (props: any, frame: number) =>
  estadoGenerico(
    props.cenas,
    frame,
    (c) => {
      const cam = CAMERAS[c.camera ?? 'palco'] ?? CAMERAS.palco;
      return {
        camPos: cam.pos,
        camLook: cam.look,
        heroiVilao: c.heroiVilao ? 1 : 0,
        tresFases: c.tresFases ? 1 : 0,
        cafe: c.cafe ? 1 : 0,
        operarios: c.operarios ? 1 : 0,
        eleicao1930: c.eleicao1930 ? 1 : 0,
        interventores: c.interventores ? 1 : 0,
        ministerios: c.ministerios ? 1 : 0,
        revolucao32: c.revolucao32 ? 1 : 0,
        carta34: c.carta34 ? 1 : 0,
        planoCohen: c.planoCohen ? 1 : 0,
        estadoNovo: c.estadoNovo ? 1 : 0,
        pijama: c.pijama ? 1 : 0,
        dipGuerra: c.dipGuerra ? 1 : 0,
        industria: c.industria ? 1 : 0,
        clt: c.clt ? 1 : 0,
        golpe1945: c.golpe1945 ? 1 : 0,
        caixa: 0,
      };
    },
    {
      camPos: 34,
      camLook: 34,
      heroiVilao: 22,
      tresFases: 26,
      cafe: 26,
      operarios: 26,
      eleicao1930: 28,
      interventores: 26,
      ministerios: 26,
      revolucao32: 28,
      carta34: 26,
      planoCohen: 24,
      estadoNovo: 26,
      pijama: 26,
      dipGuerra: 26,
      industria: 26,
      clt: 26,
      golpe1945: 28,
    },
    (a) => ({...a, camPos: [0, 9.5, 30]}),
  );

// ---------- Helpers compartilhados ----------
const Holofote: React.FC<{x: number; z?: number; v: number; cor: string; raio?: number; h?: number}> = ({
  x, z = -1.2, v, cor, raio = 1.9, h = 11,
}) => {
  if (v <= 0.01) return null;
  return (
    <group position={[x, 0, z]}>
      <mesh position-y={h / 2}>
        <coneGeometry args={[raio, h, 20, 1, true]} />
        <meshBasicMaterial color={cor} opacity={0.17 * v} side={THREE.DoubleSide} {...addMat} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position-y={0.04}>
        <circleGeometry args={[raio, 28]} />
        <meshBasicMaterial color={cor} opacity={0.38 * v} {...addMat} />
      </mesh>
    </group>
  );
};

const PessoaSimples: React.FC<{
  p: [number, number, number];
  corRoupa: string;
  corCalca?: string;
  chapeu?: 'quepe' | 'capacete' | 'nenhum';
  corChapeu?: string;
  rotY?: number;
  v?: number;
  frame: number;
  fase?: number;
  acenando?: boolean;
}> = ({
  p, corRoupa, corCalca = '#1c1b26', chapeu = 'nenhum', corChapeu = '#3a4a2a',
  rotY = 0, v = 1, frame, fase = 0, acenando = false,
}) => {
  if (v <= 0.01) return null;
  const t = frame / 30 + fase;
  const bounce = Math.abs(Math.sin(t * 3.2)) * 0.07;
  const bracoAng = acenando ? -2.2 + Math.sin(t * 7) * 0.45 : Math.sin(t * 2.5) * 0.18;
  return (
    <group position={[p[0], p[1] + bounce, p[2]]} rotation-y={rotY} scale={[v, v, v]}>
      {[-0.12, 0.12].map((dx, k) => (
        <mesh key={k} position={[dx, 0.35, 0]}>
          <cylinderGeometry args={[0.09, 0.09, 0.7, 6]} />
          <meshStandardMaterial color={corCalca} flatShading />
        </mesh>
      ))}
      <mesh position-y={1.05}>
        <boxGeometry args={[0.56, 0.78, 0.32]} />
        <meshStandardMaterial color={corRoupa} flatShading />
      </mesh>
      <mesh position={[-0.36, 1.05, 0]} rotation-z={Math.sin(t * 2.5) * 0.1}>
        <boxGeometry args={[0.15, 0.62, 0.15]} />
        <meshStandardMaterial color={corRoupa} flatShading />
      </mesh>
      <mesh position={[0.36, acenando ? 1.38 : 1.05, 0]} rotation-z={acenando ? bracoAng : -Math.sin(t * 2.5) * 0.1}>
        <boxGeometry args={[0.15, 0.62, 0.15]} />
        <meshStandardMaterial color={corRoupa} flatShading />
      </mesh>
      <mesh position-y={1.68}>
        <icosahedronGeometry args={[0.25, 0]} />
        <meshStandardMaterial color="#e8b896" flatShading />
      </mesh>
      {chapeu === 'quepe' && (
        <group position-y={1.88}>
          <mesh>
            <cylinderGeometry args={[0.28, 0.24, 0.16, 8]} />
            <meshStandardMaterial color={corChapeu} flatShading />
          </mesh>
          <mesh position={[0, -0.05, 0.18]}>
            <boxGeometry args={[0.34, 0.04, 0.16]} />
            <meshStandardMaterial color="#151515" flatShading />
          </mesh>
        </group>
      )}
      {chapeu === 'capacete' && (
        <mesh position-y={1.86}>
          <sphereGeometry args={[0.29, 7, 4, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color={corChapeu} flatShading />
        </mesh>
      )}
    </group>
  );
};

const Chama: React.FC<{p: [number, number, number]; s?: number; v: number; frame: number; seed?: number}> = ({
  p, s = 1, v, frame, seed = 1,
}) => {
  if (v <= 0.01) return null;
  const t = frame / 30;
  const r = rng(seed * 31);
  return (
    <group position={p} scale={[s * v, s * v, s * v]}>
      {[0, 1, 2, 3].map((k) => {
        const fase = r() * 6.28;
        const h = 0.85 + Math.sin(t * 8 + fase) * 0.25;
        const cor = k % 2 === 0 ? '#ff6a00' : '#ffd000';
        return (
          <mesh key={k} position={[(k - 1.5) * 0.16, h * 0.45, ((k % 2) - 0.5) * 0.18]} rotation-y={t * 3 + fase}>
            <coneGeometry args={[0.28 - k * 0.03, h, 5]} />
            <meshBasicMaterial color={cor} transparent opacity={0.9 * v} />
          </mesh>
        );
      })}
      {[0, 1, 2].map((k) => {
        const cyc = (t * 0.9 + k * 0.33) % 1;
        return (
          <mesh key={`f${k}`} position={[Math.sin(t * 2 + k) * 0.2, 1.0 + cyc * 1.6, 0]} scale={[1 - cyc * 0.4, 1 - cyc * 0.4, 1 - cyc * 0.4]}>
            <icosahedronGeometry args={[0.24, 0]} />
            <meshStandardMaterial color="#3c3348" transparent opacity={(1 - cyc) * 0.65 * v} flatShading />
          </mesh>
        );
      })}
    </group>
  );
};

// ---------- Cenário Base: Palco Teatral + Palácio do Catete + Getúlio ----------
const PalcoBase: React.FC<{frame: number; alerta?: number}> = ({frame, alerta = 0}) => {
  const t = frame / 30;
  return (
    <group>
      {/* chão escuro do teatro */}
      <mesh rotation-x={-Math.PI / 2} position={[0, -0.05, -8]}>
        <planeGeometry args={[120, 120]} />
        <meshStandardMaterial color="#0b0514" roughness={0.95} />
      </mesh>
      {/* palco circular de madeira */}
      <mesh position={[0, -0.02, -1]}>
        <cylinderGeometry args={[7.4, 7.9, 0.38, 28]} />
        <meshStandardMaterial color="#361c16" flatShading roughness={0.75} />
      </mesh>
      {/* tapete vermelho central */}
      <mesh position={[0, 0.18, -1]}>
        <cylinderGeometry args={[5.8, 5.8, 0.04, 24]} />
        <meshStandardMaterial color="#681224" flatShading roughness={0.85} />
      </mesh>
      {/* borda dourada do palco */}
      <mesh position={[0, 0.16, -1]} rotation-x={Math.PI / 2}>
        <torusGeometry args={[7.4, 0.1, 6, 36]} />
        <meshStandardMaterial color="#e8b21a" metalness={0.55} roughness={0.35} />
      </mesh>
      {/* luzes da ribalta */}
      {Array.from({length: 11}, (_, k) => {
        const ang = lerp(-1.15, 1.15, k / 10);
        const x = Math.sin(ang) * 7.15;
        const z = -1 + Math.cos(ang) * 7.15;
        const p = 0.75 + 0.25 * Math.sin(t * 4 + k);
        return (
          <mesh key={k} position={[x, 0.24, z]}>
            <icosahedronGeometry args={[0.14, 0]} />
            <meshBasicMaterial color={alerta > 0.4 ? '#ff2a3a' : '#ffe27a'} toneMapped={false} opacity={p} />
          </mesh>
        );
      })}
      {/* cortinas de veludo nas laterais */}
      {[-1, 1].map((side) => (
        <group key={side} position={[side * 5.6, 4.2, -5.2]}>
          {[0, 1, 2].map((d) => (
            <mesh key={d} position={[side * d * 0.55, 0, -d * 0.25]} rotation-z={side * 0.04}>
              <cylinderGeometry args={[0.55, 0.72, 9.2, 7]} />
              <meshStandardMaterial color={d % 2 === 0 ? '#780f24' : '#570919'} flatShading roughness={0.85} />
            </mesh>
          ))}
        </group>
      ))}
      {/* sanefa superior vermelha */}
      <mesh position={[0, 8.6, -5.0]}>
        <boxGeometry args={[14.4, 1.2, 0.7]} />
        <meshStandardMaterial color="#680b1d" flatShading />
      </mesh>
      {/* Palácio do Catete estilizado ao fundo */}
      <group position={[0, 0, -9.8]}>
        <mesh position={[0, 2.7, 0]}>
          <boxGeometry args={[9.4, 5.4, 2.2]} />
          <meshStandardMaterial color="#e6d2aa" flatShading />
        </mesh>
        <mesh position={[0, 5.6, 0]}>
          <boxGeometry args={[9.8, 0.45, 2.5]} />
          <meshStandardMaterial color="#c99c4a" flatShading />
        </mesh>
        {/* frontão clássico */}
        <mesh position={[0, 6.5, 0.3]} rotation-y={Math.PI / 4}>
          <coneGeometry args={[2.5, 1.4, 4]} />
          <meshStandardMaterial color="#d8bd8a" flatShading />
        </mesh>
        {/* colunas */}
        {[-3.2, -1.6, 1.6, 3.2].map((x, k) => (
          <mesh key={k} position={[x, 2.7, 1.2]}>
            <cylinderGeometry args={[0.2, 0.24, 5.2, 8]} />
            <meshStandardMaterial color="#f5ead2" flatShading />
          </mesh>
        ))}
        {/* porta central */}
        <mesh position={[0, 1.6, 1.12]}>
          <boxGeometry args={[1.4, 3.2, 0.14]} />
          <meshStandardMaterial color="#422618" flatShading />
        </mesh>
        {/* janelas */}
        {[-2.4, 2.4].flatMap((x) =>
          [1.6, 3.8].map((y) => (
            <mesh key={`${x}-${y}`} position={[x, y, 1.12]}>
              <boxGeometry args={[0.75, 1.1, 0.1]} />
              <meshStandardMaterial color={alerta > 0.4 ? '#ff3a3a' : '#ffcf6e'} emissive={alerta > 0.4 ? '#aa1010' : '#9a6810'} emissiveIntensity={0.55} />
            </mesh>
          )),
        )}
      </group>
    </group>
  );
};

const GetulioBoneco: React.FC<{frame: number; elevacao: number; dramático?: number}> = ({frame, elevacao, dramático = 0}) => {
  const t = frame / 30;
  const gesticula = Math.sin(t * 4.2) * 0.32;
  const inclina = Math.sin(t * 1.4) * 0.06;
  return (
    <group position={[0, 0.18 + elevacao, -1.2]}>
      {/* pódio presidencial */}
      <mesh position={[0, 0.35, 0]}>
        <cylinderGeometry args={[1.05, 1.25, 0.7, 10]} />
        <meshStandardMaterial color="#2a163d" flatShading />
      </mesh>
      <mesh position={[0, 0.71, 0]} rotation-x={Math.PI / 2}>
        <torusGeometry args={[1.05, 0.06, 5, 16]} />
        <meshStandardMaterial color="#ffd000" metalness={0.5} roughness={0.3} />
      </mesh>
      {/* corpo de Getúlio */}
      <group position={[0, 0.7, 0]} rotation-y={inclina}>
        {[-0.2, 0.2].map((dx, k) => (
          <mesh key={k} position={[dx, 0.45, 0]}>
            <cylinderGeometry args={[0.13, 0.12, 0.9, 6]} />
            <meshStandardMaterial color="#181922" flatShading />
          </mesh>
        ))}
        {/* paletó escuro */}
        <mesh position-y={1.32}>
          <cylinderGeometry args={[0.42, 0.48, 1.05, 8]} />
          <meshStandardMaterial color="#1f212e" flatShading />
        </mesh>
        {/* camisa branca e gravata */}
        <mesh position={[0, 1.48, 0.39]}>
          <boxGeometry args={[0.24, 0.56, 0.1]} />
          <meshStandardMaterial color="#f5f5f5" />
        </mesh>
        <mesh position={[0, 1.38, 0.45]}>
          <boxGeometry args={[0.09, 0.42, 0.04]} />
          <meshStandardMaterial color="#7a1424" />
        </mesh>
        {/* faixa presidencial verde e amarela */}
        <mesh position={[0, 1.35, 0.42]} rotation-z={0.58}>
          <boxGeometry args={[0.18, 1.1, 0.08]} />
          <meshStandardMaterial color="#1f9e4a" flatShading />
        </mesh>
        <mesh position={[0.05, 1.35, 0.43]} rotation-z={0.58}>
          <boxGeometry args={[0.07, 1.08, 0.08]} />
          <meshStandardMaterial color="#ffd000" flatShading />
        </mesh>
        {/* braços teatrais */}
        <mesh position={[-0.54, 1.45, 0.1]} rotation={[0.4 + gesticula, 0, 0.35]}>
          <boxGeometry args={[0.18, 0.74, 0.18]} />
          <meshStandardMaterial color="#1f212e" flatShading />
        </mesh>
        <mesh position={[0.54, 1.52 + dramático * 0.18, 0.14]} rotation={[-0.5 - gesticula, 0, -0.42]}>
          <boxGeometry args={[0.18, 0.74, 0.18]} />
          <meshStandardMaterial color="#1f212e" flatShading />
        </mesh>
        {/* cabeça */}
        <mesh position-y={2.12} scale={[0.92, 1.04, 0.92]}>
          <icosahedronGeometry args={[0.38, 1]} />
          <meshStandardMaterial color="#e8b692" flatShading />
        </mesh>
        {/* cabelo penteado pra trás */}
        <mesh position={[0, 2.32, -0.06]} scale={[0.96, 0.52, 0.98]}>
          <icosahedronGeometry args={[0.38, 1]} />
          <meshStandardMaterial color="#2a2420" flatShading />
        </mesh>
        {/* óculos redondos característicos */}
        {[-0.13, 0.13].map((x, k) => (
          <mesh key={k} position={[x, 2.15, 0.34]}>
            <torusGeometry args={[0.09, 0.018, 4, 12]} />
            <meshStandardMaterial color="#161616" />
          </mesh>
        ))}
        <mesh position={[0, 2.16, 0.35]}>
          <boxGeometry args={[0.09, 0.02, 0.02]} />
          <meshStandardMaterial color="#161616" />
        </mesh>
      </group>
    </group>
  );
};

// ---------- Atos / Props Históricos ----------
const AtoHeroiVilao: React.FC<{v: number; frame: number}> = ({v, frame}) => {
  if (v <= 0.01) return null;
  const bal = Math.sin((frame / 30) * 3) * 0.16;
  return (
    <group>
      <Holofote x={-2.5} v={v} cor="#3df28f" raio={1.45} />
      <Holofote x={2.5} v={v} cor="#ff384c" raio={1.45} />
      <Label text="HERÓI?" border="#3df28f" position={[-2.4, 3.6 + bal, 0.4]} height={0.85} opacity={v} />
      <Label text="VILÃO?" border="#ff384c" position={[2.4, 3.6 - bal, 0.4]} height={0.85} opacity={v} />
    </group>
  );
};

const AtoTresFases: React.FC<{v: number}> = ({v}) => {
  if (v <= 0.01) return null;
  const fases = [
    {x: -2.8, h: 1.6, cor: '#ffd000', txt: '1930-34 PROVISÓRIO'},
    {x: 0, h: 2.3, cor: '#ff7b00', txt: '1934-37 CONSTITUCIONAL'},
    {x: 2.8, h: 3.1, cor: '#ff1e56', txt: '1937-45 ESTADO NOVO'},
  ];
  return (
    <group position={[0, 0.2, 1.5]}>
      {fases.map((f, idx) => {
        const p = clamp01(v * 1.5 - idx * 0.22);
        return (
          <group key={idx} position={[f.x, 0, 0]}>
            <mesh position-y={(f.h * p) / 2}>
              <boxGeometry args={[1.35, Math.max(0.05, f.h * p), 1.0]} />
              <meshStandardMaterial color={f.cor} flatShading />
            </mesh>
            <Label text={f.txt} border={f.cor} position={[0, f.h * p + 0.65, 0.3]} height={0.48} opacity={p} />
          </group>
        );
      })}
    </group>
  );
};

const AtoCafe: React.FC<{v: number; frame: number}> = ({v, frame}) => {
  if (v <= 0.01) return null;
  return (
    <group position={[-2.5, 0.2, 0.8]}>
      {/* pirâmide de sacas */}
      {[
        [-0.55, 0.25, 0], [0, 0.25, 0], [0.55, 0.25, 0],
        [-0.28, 0.68, 0.1], [0.28, 0.68, 0.1], [0, 1.1, 0.05],
      ].map((pos, k) => (
        <mesh key={k} position={[pos[0], pos[1], pos[2]]} scale={[v, v, v]}>
          <boxGeometry args={[0.52, 0.38, 0.72]} />
          <meshStandardMaterial color={k % 2 ? '#8f6234' : '#744b24'} flatShading />
        </mesh>
      ))}
      <Chama p={[0, 1.1, 0.1]} s={1.25} v={v} frame={frame} seed={7} />
      <Label text="78M DE SACAS QUEIMADAS" border="#ff7b00" position={[0.6, 3.1, 0.4]} height={0.5} opacity={v} />
    </group>
  );
};

const AtoOperarios: React.FC<{v: number; frame: number}> = ({v, frame}) => {
  if (v <= 0.01) return null;
  return (
    <group position={[2.6, 0.2, 0.6]}>
      {/* fábrica low poly */}
      <mesh position={[0, 1.0 * v, -0.4]}>
        <boxGeometry args={[2.1, 2.0 * v, 1.4]} />
        <meshStandardMaterial color="#454c5c" flatShading />
      </mesh>
      {[-0.6, 0.4].map((x, k) => (
        <mesh key={k} position={[x, 2.3 * v, -0.5]}>
          <cylinderGeometry args={[0.16, 0.24, 1.4 * v, 6]} />
          <meshStandardMaterial color="#8f3224" flatShading />
        </mesh>
      ))}
      <PessoaSimples p={[-0.7, 0, 0.85]} corRoupa="#2e67c9" frame={frame} fase={0.2} v={v} />
      <PessoaSimples p={[0.15, 0, 1.0]} corRoupa="#387ee6" frame={frame} fase={1.8} v={v} acenando />
      <PessoaSimples p={[0.9, 0, 0.7]} corRoupa="#2453a6" frame={frame} fase={3.1} v={v} />
      <Label text="40M · CAMPO → CIDADE" border="#3dd6f5" position={[0, 3.55, 0.3]} height={0.55} opacity={v} />
    </group>
  );
};

const AtoEleicao1930: React.FC<{v: number; frame: number}> = ({v, frame}) => {
  if (v <= 0.01) return null;
  const marcha = clamp01(v * 1.3);
  return (
    <group position={[0, 0.2, 0.9]}>
      {/* urna eleitoral da derrota à esquerda */}
      <group position={[-2.6, 0, 0.2]} scale={[v, v, v]}>
        <mesh position-y={0.65}>
          <boxGeometry args={[1.1, 1.3, 0.9]} />
          <meshStandardMaterial color="#d8c38a" flatShading />
        </mesh>
        <mesh position={[0, 1.32, 0]}>
          <boxGeometry args={[0.6, 0.08, 0.14]} />
          <meshBasicMaterial color="#111" />
        </mesh>
        <Label text="JÚLIO PRESTES VENCEU" border="#e9b21a" position={[0, 2.25, 0.2]} height={0.5} opacity={v} />
      </group>
      {/* tenentes marchando da direita rumo ao palco */}
      {[0, 1, 2].map((k) => (
        <PessoaSimples
          key={k}
          p={[lerp(4.4, 1.9 + k * 0.7, marcha), 0, 0.2 + (k % 2) * 0.5]}
          corRoupa="#4a5d34"
          corCalca="#344224"
          chapeu="quepe"
          rotY={-1.1}
          v={v}
          frame={frame}
          fase={k * 1.4}
        />
      ))}
      <Label text="GOLPE DE 1930" border="#ff384c" position={[2.4, 2.8, 0.3]} height={0.58} opacity={v} />
    </group>
  );
};

const AtoInterventores: React.FC<{v: number}> = ({v}) => {
  if (v <= 0.01) return null;
  return (
    <group position={[0, 0.2, 1.7]}>
      {[-2.8, -1.4, 0, 1.4, 2.8].map((x, k) => {
        const flip = clamp01(v * 1.6 - k * 0.12);
        const cor = k === 2 ? '#ffd000' : '#ff384c';
        return (
          <group key={k} position={[x, 0, 0]} rotation-y={flip * Math.PI}>
            <mesh position-y={0.75 * flip}>
              <cylinderGeometry args={[0.25, 0.35, 1.5 * flip, 6]} />
              <meshStandardMaterial color={cor} flatShading />
            </mesh>
            <mesh position-y={1.65 * flip}>
              <octahedronGeometry args={[0.28 * flip, 0]} />
              <meshBasicMaterial color="#ffd000" />
            </mesh>
          </group>
        );
      })}
      <Label text="INTERVENTORES NOS ESTADOS" border="#ff384c" position={[0, 2.55, 0.4]} height={0.54} opacity={v} />
    </group>
  );
};

const AtoMinisterios: React.FC<{v: number}> = ({v}) => {
  if (v <= 0.01) return null;
  const cols = [
    {x: -2.4, cor: '#3dd6f5', txt: 'EDUCAÇÃO E SAÚDE'},
    {x: 2.4, cor: '#3df28f', txt: 'TRABALHO E INDÚSTRIA'},
  ];
  return (
    <group position={[0, 0.2, 0.8]}>
      {cols.map((c, idx) => (
        <group key={idx} position={[c.x, 0, 0]}>
          <mesh position-y={1.4 * v}>
            <cylinderGeometry args={[0.55, 0.65, 2.8 * v, 8]} />
            <meshStandardMaterial color={c.cor} emissive={c.cor} emissiveIntensity={0.35} flatShading />
          </mesh>
          <Label text={c.txt} border={c.cor} position={[0, 3.25 * v, 0.3]} height={0.5} opacity={v} />
        </group>
      ))}
    </group>
  );
};

const AtoRevolucao32: React.FC<{v: number; frame: number}> = ({v, frame}) => {
  if (v <= 0.01) return null;
  const t = frame / 30;
  const avX = Math.sin(t * 1.9) * 3.1;
  const avZ = Math.cos(t * 1.9) * 1.6 - 0.5;
  return (
    <group position={[0, 0.2, 0.6]}>
      {/* barricada paulista */}
      <group position={[-2.3, 0, 0.7]} scale={[v, v, v]}>
        <mesh position-y={0.4}>
          <boxGeometry args={[2.1, 0.8, 0.7]} />
          <meshStandardMaterial color="#6e5338" flatShading />
        </mesh>
        <PessoaSimples p={[-0.5, 0.4, -0.3]} corRoupa="#4a4a52" chapeu="capacete" corChapeu="#2c2c34" frame={frame} fase={0.5} />
        <PessoaSimples p={[0.5, 0.4, -0.3]} corRoupa="#383840" chapeu="capacete" corChapeu="#2c2c34" frame={frame} fase={2.0} />
      </group>
      {/* biplano circulando acima */}
      <group position={[avX, 4.1, avZ]} rotation-y={t * 1.9 + Math.PI / 2} scale={[v, v, v]}>
        <mesh>
          <boxGeometry args={[0.35, 0.35, 1.4]} />
          <meshStandardMaterial color="#c8201a" flatShading />
        </mesh>
        <mesh position-y={0.22}>
          <boxGeometry args={[2.0, 0.06, 0.4]} />
          <meshStandardMaterial color="#e8d29c" flatShading />
        </mesh>
        <mesh position-y={-0.14}>
          <boxGeometry args={[1.8, 0.06, 0.36]} />
          <meshStandardMaterial color="#e8d29c" flatShading />
        </mesh>
      </group>
      <Label text="MMDC · 9 DE JULHO" border="#ff4d4f" position={[-2.2, 2.7, 0.9]} height={0.56} opacity={v} />
    </group>
  );
};

const AtoCarta34: React.FC<{v: number; estadoNovo: number; frame: number}> = ({v, estadoNovo, frame}) => {
  if (v <= 0.01) return null;
  const s = v * (0.78 - 0.08 * estadoNovo);
  const flutua = Math.sin((frame / 30) * 2) * 0.08;
  return (
    <group position={[0, 1.05 + flutua, 1.3]} scale={[s, s, s]}>
      {/* livro aberto da Constituição */}
      {[-0.78, 0.78].map((x, k) => (
        <mesh key={k} position={[x, 0, 0]} rotation-y={k === 0 ? 0.25 : -0.25}>
          <boxGeometry args={[1.5, 1.7, 0.14]} />
          <meshStandardMaterial color="#f5e7c4" flatShading />
        </mesh>
      ))}
      <mesh position={[0, 0, -0.06]}>
        <boxGeometry args={[0.25, 1.75, 0.18]} />
        <meshStandardMaterial color="#8a5a24" flatShading />
      </mesh>
      {/* grades do Estado Novo fechando por cima */}
      {estadoNovo > 0.02 && (
        <group position={[0, lerp(3.4, 0, estadoNovo), 0.35]}>
          {[-1.0, -0.5, 0, 0.5, 1.0].map((x, k) => (
            <mesh key={k} position={[x, 0, 0]}>
              <cylinderGeometry args={[0.06, 0.06, 2.0, 6]} />
              <meshStandardMaterial color="#424652" metalness={0.7} roughness={0.3} />
            </mesh>
          ))}
          <mesh position={[0, -0.35, 0.12]}>
            <boxGeometry args={[0.6, 0.65, 0.2]} />
            <meshStandardMaterial color="#ffd000" metalness={0.5} roughness={0.35} />
          </mesh>
        </group>
      )}
      {estadoNovo < 0.5 && (
        <>
          <Label text="CARTA MONSTRO · 1934" border="#ffd000" position={[0, 1.45, 0.25]} height={0.52} opacity={v * (1 - estadoNovo * 2)} />
          <Label text="VOTO FEMININO · VOTO SECRETO" border="#3df28f" position={[0, -1.18, 0.25]} height={0.44} opacity={v * (1 - estadoNovo * 2)} />
        </>
      )}
      {estadoNovo > 0.2 && (
        <Label text="DITADURA DO ESTADO NOVO" border="#ff2d55" position={[0, 1.6, 0.4]} height={0.58} opacity={estadoNovo} />
      )}
    </group>
  );
};

const AtoPlanoCohen: React.FC<{v: number; frame: number}> = ({v, frame}) => {
  if (v <= 0.01) return null;
  const pisca = 0.65 + 0.35 * Math.sin((frame / 30) * 14);
  return (
    <group position={[0, 0.2, 0.8]}>
      {/* casinhas pegando fogo (pânico fabricado) */}
      {[-2.7, 2.7].map((x, idx) => (
        <group key={idx} position={[x, 0, 0.2]} scale={[v, v, v]}>
          <mesh position-y={0.45}>
            <boxGeometry args={[1.1, 0.9, 1.0]} />
            <meshStandardMaterial color="#e0ceb0" flatShading />
          </mesh>
          <mesh position-y={1.15} rotation-y={Math.PI / 4}>
            <coneGeometry args={[0.92, 0.65, 4]} />
            <meshStandardMaterial color="#a83226" flatShading />
          </mesh>
          <Chama p={[0, 0.95, 0.1]} s={0.95} v={v} frame={frame} seed={idx + 3} />
        </group>
      ))}
      <Holofote x={0} v={v * pisca} cor="#ff1e38" raio={2.2} />
      <Label text="PLANO COHEN (FALSO!)" border="#ff1e38" position={[0, 4.1, 0.6]} height={0.62} opacity={v} />
      <Label text="VÃO QUEIMAR SUA CASA!" border="#ff7b00" position={[-2.6, 2.8, 0.5]} height={0.46} opacity={v} />
    </group>
  );
};

const AtoPijama: React.FC<{v: number; frame: number}> = ({v, frame}) => {
  if (v <= 0.01) return null;
  return (
    <group position={[0, 0.2, 0.9]}>
      {/* integralistas de camisa verde tentando invadir */}
      {[-2.8, -2.0, -1.2].map((x, k) => (
        <PessoaSimples key={k} p={[x, 0, 0.3 + (k % 2) * 0.4]} corRoupa="#236b32" corCalca="#1c241d" rotY={0.7} v={v} frame={frame} fase={k} />
      ))}
      {/* linha cortada + caixa "dinamite esquecida" */}
      <group position={[2.4, 0, 0.3]} scale={[v, v, v]}>
        <mesh position-y={0.45}>
          <boxGeometry args={[1.1, 0.85, 0.85]} />
          <meshStandardMaterial color="#9e743c" flatShading />
        </mesh>
        <Label text="ESQUECERAM A DINAMITE!" border="#ffd000" position={[0, 1.6, 0.2]} height={0.5} opacity={v} />
      </group>
      <Label text="LINHA SECRETA" border="#3dd6f5" position={[-1.9, 2.75, 0.5]} height={0.52} opacity={v} />
    </group>
  );
};

const AtoDipGuerra: React.FC<{v: number; frame: number}> = ({v, frame}) => {
  if (v <= 0.01) return null;
  const t = frame / 30;
  return (
    <group position={[0, 0.2, 0.6]}>
      {/* torre de rádio DIP dourada */}
      <group position={[0, 0, -2.5]} scale={[v, v, v]}>
        <mesh position-y={2.4}>
          <coneGeometry args={[0.75, 4.8, 4]} />
          <meshStandardMaterial color="#ffd000" wireframe />
        </mesh>
        <mesh position-y={4.9}>
          <icosahedronGeometry args={[0.26, 0]} />
          <meshBasicMaterial color="#ffd000" />
        </mesh>
        <Label text="DIP · PAI DOS POBRES" border="#ffd000" position={[0, 5.65, 0.3]} height={0.54} opacity={v} />
      </group>
      {/* cabo de guerra Alemanha vs EUA */}
      <group position={[-2.6, 0.55 + Math.sin(t * 2) * 0.08, 0.9]} scale={[v, v, v]}>
        <mesh>
          <boxGeometry args={[1.25, 1.0, 1.0]} />
          <meshStandardMaterial color="#4a4a52" flatShading />
        </mesh>
        <Label text="ALEMANHA" border="#ff4d4f" position={[0, 1.3, 0.2]} height={0.5} opacity={v} />
      </group>
      <group position={[2.6, 0.65 - Math.sin(t * 2) * 0.08, 0.9]} scale={[v, v, v]}>
        <mesh>
          <boxGeometry args={[1.45, 1.15, 1.1]} />
          <meshStandardMaterial color="#1f9e6a" flatShading />
        </mesh>
        <Label text="EUA · US$ 200 MI" border="#3df28f" position={[0, 1.45, 0.2]} height={0.54} opacity={v} />
      </group>
    </group>
  );
};

const AtoIndustria: React.FC<{v: number; frame: number}> = ({v, frame}) => {
  if (v <= 0.01) return null;
  return (
    <group position={[0, 0.2, 0.6]}>
      {/* alto-forno CSN + Vale */}
      <group position={[-2.4, 0, 0]} scale={[v, v, v]}>
        <mesh position-y={1.3}>
          <cylinderGeometry args={[0.7, 0.95, 2.6, 8]} />
          <meshStandardMaterial color="#3c4250" flatShading />
        </mesh>
        <Chama p={[0, 2.6, 0]} s={0.85} v={v} frame={frame} seed={19} />
        <Label text="CSN + VALE · AÇO" border="#ff9e00" position={[0, 4.0, 0.3]} height={0.52} opacity={v} />
      </group>
      {/* seringueiras / soldados da borracha */}
      <group position={[2.5, 0, 0.2]} scale={[v, v, v]}>
        {[-0.5, 0.5].map((x, k) => (
          <group key={k} position={[x, 0, 0]}>
            <mesh position-y={1.1}>
              <cylinderGeometry args={[0.14, 0.2, 2.2, 6]} />
              <meshStandardMaterial color="#6e4a2b" flatShading />
            </mesh>
            <mesh position-y={2.3}>
              <icosahedronGeometry args={[0.85, 0]} />
              <meshStandardMaterial color="#2f7d3a" flatShading />
            </mesh>
          </group>
        ))}
        <Label text="10 MIL NA BORRACHA" border="#3df28f" position={[0, 3.6, 0.3]} height={0.5} opacity={v} />
      </group>
    </group>
  );
};

const AtoClt: React.FC<{v: number; frame: number}> = ({v, frame}) => {
  if (v <= 0.01) return null;
  return (
    <group position={[0, 0.2, 1.45]}>
      {/* monumento carteira de trabalho */}
      <group position={[0, 0.85 * v, 0]} scale={[v, v, v]}>
        <mesh>
          <boxGeometry args={[1.95, 1.65, 0.24]} />
          <meshStandardMaterial color="#1f58b8" flatShading />
        </mesh>
        <mesh position={[0, 0.26, 0.14]}>
          <boxGeometry args={[1.4, 0.34, 0.06]} />
          <meshStandardMaterial color="#ffd000" flatShading />
        </mesh>
      </group>
      <PessoaSimples p={[-2.1, 0, 0.3]} corRoupa="#3dd6f5" v={v} frame={frame} fase={0.4} acenando />
      <PessoaSimples p={[2.1, 0, 0.3]} corRoupa="#3df28f" v={v} frame={frame} fase={2.1} acenando />
      <Label text="CLT 1943 · 8 HORAS" border="#ffd000" position={[0, 2.2, 0.4]} height={0.56} opacity={v} />
    </group>
  );
};

const AtoGolpe1945: React.FC<{v: number; frame: number}> = ({v, frame}) => {
  if (v <= 0.01) return null;
  const golpes = [
    {x: -2.6, txt: '1930: GOLPE 1', cor: '#ffd000', h: 1.5},
    {x: 0, txt: '1937: GOLPE 2', cor: '#ff7b00', h: 2.1},
    {x: 2.6, txt: '1945: GOLPE 3', cor: '#ff1e56', h: 2.7},
  ];
  return (
    <group position={[0, 0.2, 1.4]}>
      {golpes.map((g, idx) => {
        const p = clamp01(v * 1.4 - idx * 0.18);
        return (
          <group key={idx} position={[g.x, 0, 0]}>
            <mesh position-y={(g.h * p) / 2}>
              <boxGeometry args={[1.25, Math.max(0.05, g.h * p), 0.9]} />
              <meshStandardMaterial color={g.cor} emissive={g.cor} emissiveIntensity={0.28} flatShading />
            </mesh>
            <Label text={g.txt} border={g.cor} position={[0, g.h * p + 0.65, 0.3]} height={0.5} opacity={p} />
          </group>
        );
      })}
      <PessoaSimples p={[-1.4, 0, 1.1]} corRoupa="#4a5d34" chapeu="quepe" rotY={0.4} v={v} frame={frame} fase={0.7} />
      <PessoaSimples p={[1.4, 0, 1.1]} corRoupa="#4a5d34" chapeu="quepe" rotY={-0.4} v={v} frame={frame} fase={2.2} />
      <Label text="BENJAMIM NA POLÍCIA" border="#ff4d4f" position={[0, 3.85, 0.5]} height={0.5} opacity={v} />
    </group>
  );
};

export const CenaPalcoVargas: React.FC<{st: any; frame: number}> = ({st, frame}) => {
  const alerta = Math.max(st.planoCohen ?? 0, (st.estadoNovo ?? 0) * 0.6, st.alertaExtra ?? 0);
  const elevacao = (st.estadoNovo ?? 0) * 0.65 + (st.dipGuerra ?? 0) * 0.35 - (st.golpe1945 ?? 0) * 0.35 + (st.elevacaoExtra ?? 0);

  return (
    <>
      <fog attach="fog" args={['#12071f', 26, 85]} />
      <hemisphereLight args={['#ffe4b5', '#221036', 1.15]} />
      <directionalLight position={[-10, 18, 16]} intensity={1.55} color="#fff2d6" />
      <directionalLight position={[12, 14, 10]} intensity={0.9} color="#ffb060" />
      <ambientLight intensity={0.28} />
      <CameraRig pos={st.camPos} look={st.camLook} frame={frame} />

      <PalcoBase frame={frame} alerta={alerta} />
      <Holofote x={0} z={-1.2} v={0.9} cor={alerta > 0.4 ? '#ff384c' : '#ffd000'} raio={1.85} h={12} />
      <GetulioBoneco frame={frame} elevacao={elevacao} dramático={Math.max(st.heroiVilao ?? 0, st.estadoNovo ?? 0, st.dramaticoExtra ?? 0)} />

      <AtoHeroiVilao v={st.heroiVilao ?? 0} frame={frame} />
      <AtoTresFases v={st.tresFases ?? 0} />
      <AtoCafe v={st.cafe ?? 0} frame={frame} />
      <AtoOperarios v={st.operarios ?? 0} frame={frame} />
      <AtoEleicao1930 v={st.eleicao1930 ?? 0} frame={frame} />
      <AtoInterventores v={st.interventores ?? 0} />
      <AtoMinisterios v={st.ministerios ?? 0} />
      <AtoRevolucao32 v={st.revolucao32 ?? 0} frame={frame} />
      <AtoCarta34 v={st.carta34 ?? 0} estadoNovo={st.estadoNovo ?? 0} frame={frame} />
      <AtoPlanoCohen v={st.planoCohen ?? 0} frame={frame} />
      <AtoPijama v={st.pijama ?? 0} frame={frame} />
      <AtoDipGuerra v={st.dipGuerra ?? 0} frame={frame} />
      <AtoIndustria v={st.industria ?? 0} frame={frame} />
      <AtoClt v={st.clt ?? 0} frame={frame} />
      <AtoGolpe1945 v={st.golpe1945 ?? 0} frame={frame} />
    </>
  );
};

export const MundoVargas: React.FC<{props: any}> = ({props}) => {
  const frame = useCurrentFrame();
  const st: any = estadoVargas(props, frame);
  return <CenaPalcoVargas st={st} frame={frame} />;
};
