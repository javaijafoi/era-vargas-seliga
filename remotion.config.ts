import {Config} from '@remotion/cli/config';
Config.setChromiumOpenGlRenderer('swangle');
Config.setVideoImageFormat('jpeg');
Config.setBrowserExecutable(process.env.REMOTION_BROWSER ?? null);
