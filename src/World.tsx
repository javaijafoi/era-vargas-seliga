import React from 'react';
import {useThree} from '@react-three/fiber';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {Car, LightBeam, NeonBar, Road, Trees, Label, rng} from './components/Kit';
import {estadoNoFrame, LANES} from './timeline';

const SCROLL = 16; // unidades por segundo (sensação de velocidade)
const BAR_Z = -10;
const BAR_MAX_H = 7.5;

const CameraRig: React.FC<{pos: number[]; look: number[]; frame: number}> = ({pos, look, frame}) => {
  const {camera} = useThree();
  const t = frame / 30;
  camera.position.set(pos[0] + Math.sin(t * 0.35) * 0.25, pos[1] + Math.sin(t * 0.5) * 0.08, pos[2]);
  camera.lookAt(look[0], look[1], look[2]);
  camera.updateProjectionMatrix();
  return null;
};

export const World: React.FC<{props: any}> = ({props}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const carros = props.carros;
  const st = estadoNoFrame(props.cenas, carros.length, frame);
  const travel = (frame / fps) * SCROLL;
  const vs = carros.map((c: any) => c.velocidade);
  const vmin = Math.min(...vs), vmax = Math.max(...vs);
  const maxH = Math.max(...carros.map((c: any) => c.horas));
  const algumFoco = Math.max(...st.foco);

  return (
    <>
      <fog attach="fog" args={['#141d31', 35, 175]} />
      <hemisphereLight args={['#7f93d0', '#24382a', 1.25]} />
      <directionalLight position={[-12, 25, 30]} intensity={1.6} color="#c4d0ff" />
      <directionalLight position={[20, 10, -40]} intensity={0.35} color="#7aa0ff" />
      <ambientLight intensity={0.25} />

      <CameraRig pos={st.camPos} look={st.camLook} frame={frame} />
      <Road travel={travel} lanes={LANES} />
      <Trees travel={travel} roadHalf={7.5} />

      {carros.map((c: any, i: number) => {
        const norm = vmax === vmin ? 0 : (c.velocidade - vmin) / (vmax - vmin);
        const z = -norm * 20 * st.corrida + Math.sin(frame / 40 + i * 2) * 0.15;
        const x = LANES[i];
        const dim = algumFoco > 0.01 ? 0.55 + 0.45 * st.foco[i] : 1;
        return (
          <group key={i}>
            <Car color={c.cor} position={[x, 0, z]} frame={frame} brilho={0.4 + 0.6 * st.foco[i]} />
            <Label
              text={`${c.velocidade} km/h`}
              border={c.cor}
              position={[x, 2.9 + 0.3 * st.foco[i], z]}
              height={0.8 + 0.2 * st.foco[i]}
              opacity={st.velocidades * dim}
            />
            <NeonBar
              position={[x, 0, BAR_Z]}
              height={(c.horas / maxH) * BAR_MAX_H}
              grow={st.barras[i]}
              color={i === 0 ? '#38f28b' : c.cor}
              label={c.label}
            />
          </group>
        );
      })}

      <LightBeam
        x={0}
        zStart={-3}
        length={90}
        grow={st.feixe}
        label={`${props.distanciaKm} km`}
      />
    </>
  );
};

// Estrelas no céu (camada 2D atrás do canvas transparente não é usada; ficam aqui como pontos)
export const starField = (() => {
  const r = rng(42);
  return Array.from({length: 140}, () => ({x: r() * 100, y: r() * 45, s: 1 + r() * 2.2, a: 0.25 + r() * 0.6, p: r() * 6}));
})();
