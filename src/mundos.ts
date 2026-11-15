// Registro dos tipos de vídeo: cada um tem seu mundo 3D e sua função de estado por frame.
import {World} from './World';
import {estadoNoFrame} from './timeline';
import {MundoMedidas, estadoMedidas} from './videos/medidas';
import {MundoPonderada, estadoPonderada} from './videos/ponderada';
import {MundoPesquisa, estadoPesquisa} from './videos/pesquisa';
import {MundoGraficos, estadoGraficos} from './videos/graficos';
import {MundoChegada, estadoChegada} from './videos/chegada';
import {MundoPlacar, estadoPlacar} from './videos/placar';
import {MundoVargas, estadoVargas} from './videos/vargas';

export const MUNDOS: Record<string, {World: any; estado: (props: any, frame: number) => any}> = {
  estrada: {World, estado: (p, f) => estadoNoFrame(p.cenas, p.carros.length, f)},
  medidas: {World: MundoMedidas, estado: estadoMedidas},
  ponderada: {World: MundoPonderada, estado: estadoPonderada},
  pesquisa: {World: MundoPesquisa, estado: estadoPesquisa},
  graficos: {World: MundoGraficos, estado: estadoGraficos},
  chegada: {World: MundoChegada, estado: estadoChegada},
  placar: {World: MundoPlacar, estado: estadoPlacar},
  vargas: {World: MundoVargas, estado: estadoVargas},
};
