import * as path from 'path';
import * as Redux from 'redux';
import { selectors, types, util } from 'vortex-api';

interface IGameSupport {
  mygamesPath: string;
  iniName: string;
}

export const gameSupportXboxPass = {
  skyrimse: {
    mygamesPath: 'Skyrim Special Edition MS',
  },
  fallout4: {
    mygamesPath: 'Fallout4 MS',
  },
};

const gameSupport = util.makeOverlayableDictionary<string, IGameSupport>({
  skyrim: {
    mygamesPath: 'skyrim',
    iniName: 'Skyrim.ini',
  },
  enderal: {
    mygamesPath: 'enderal',
    iniName: 'Enderal.ini',
  },
  skyrimse: {
    mygamesPath: 'Skyrim Special Edition',
    iniName: 'Skyrim.ini',
  },
  enderalspecialedition: {
    mygamesPath: 'Enderal Special Edition',
    iniName: 'Enderal.ini',
  },
  skyrimvr: {
    mygamesPath: 'Skyrim VR',
    iniName: 'SkyrimVR.ini',
  },
  fallout3: {
    mygamesPath: 'Fallout3',
    iniName: 'Fallout.ini',
  },
  fallout4: {
    mygamesPath: 'Fallout4',
    iniName: 'Fallout4.ini',
  },
  fallout4vr: {
    mygamesPath: 'Fallout4VR',
    iniName: 'Fallout4Custom.ini',
  },
  falloutnv: {
    mygamesPath: 'FalloutNV',
    iniName: 'Fallout.ini',
  },
  oblivion: {
    mygamesPath: 'Oblivion',
    iniName: 'Oblivion.ini',
  },
}, {
  xbox: gameSupportXboxPass,
  gog: {
    skyrimse: {
      mygamesPath: 'Skyrim Special Edition GOG',
    },
  },
}, (gameId: string) => gameStoreForGame(gameId));

let gameStoreForGame: (gameId: string) => string = () => undefined;

export function initGameSupport(store: Redux.Store<types.IState>) {
  const state: types.IState = store.getState();

  gameStoreForGame = (gameId: string) => selectors.discoveryByGame(store.getState(), gameId)['store'];

  const {discovered} = state.settings.gameMode;

  if (discovered['enderalspecialedition']?.path !== undefined) {
    if (discovered['enderalspecialedition']?.path.toLowerCase().includes('skyrim')) {
      gameSupport['enderalspecialedition'] = JSON.parse(JSON.stringify(gameSupport['skyrimse']));
    }
  }
}

export function gameSupported(gameMode: string): boolean {
  return gameSupport.has(gameMode);
}

export function mygamesPath(gameMode: string): string {
  return path.join(util.getVortexPath('documents'), 'My Games', gameSupport.get(gameMode, 'mygamesPath'));
}

export function iniPath(gameMode: string): string {
  return path.join(mygamesPath(gameMode), gameSupport.get(gameMode, 'iniName'));
}
