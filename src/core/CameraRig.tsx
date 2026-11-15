import React from 'react';
import {useThree} from '@react-three/fiber';

export const CameraRig: React.FC<{pos: number[]; look: number[]; frame: number; drift?: number}> = ({pos, look, frame, drift = 1}) => {
  const {camera} = useThree();
  const t = frame / 30;
  camera.position.set(pos[0] + Math.sin(t * 0.35) * 0.25 * drift, pos[1] + Math.sin(t * 0.5) * 0.08 * drift, pos[2]);
  camera.lookAt(look[0], look[1], look[2]);
  camera.updateProjectionMatrix();
  return null;
};
