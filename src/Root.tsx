import React from 'react';
import {Composition} from 'remotion';
import {Video} from './Video';
import videos from './generated/index';

export const RemotionRoot: React.FC = () => (
  <>
    {Object.entries(videos).map(([id, props]: [string, any]) => (
      <Composition
        key={id}
        id={id}
        component={Video as any}
        durationInFrames={props.cenas.reduce((a: number, c: any) => a + c.frames, 0)}
        fps={props.fps}
        width={1080}
        height={1920}
        defaultProps={props}
      />
    ))}
  </>
);
