import * as path from 'path';
import * as Redux from 'redux';
import { selectors, types, util } from 'vortex-api';

export const gameSupportXboxPass = {
  skyrimse: {
    mygamesPath: 'Skyrim Special Edition MS',
  },
  fallout4: {
    mygamesPath: 'Fallout4 MS',
  },
}

const gameSupportGOG = {
  skyrimse: {
    mygamesPath: 'Skyrim Special Edition GOG',
  },
};

const gameSupport = {
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
};

export function isXboxPath(discoveryPath: string) {
  const hasPathElement = (element) =>
    discoveryPath.toLowerCase().includes(element);
  return ['modifiablewindowsapps', '3275kfvn8vcwc'].find(hasPathElement) !== undefined;
}

let gameStoreForGame: (gameId: string) => string = () => undefined;

export function initGameSupport(store: Redux.Store<types.IState>) {
  const state: types.IState = store.getState();

  gameStoreForGame = (gameId: string) => selectors.discoveryByGame(store.getState(), gameId)['store'];

  const {discovered} = state.settings.gameMode;

  Object.keys(gameSupportXboxPass).forEach(gameMode => {
    if (discovered[gameMode]?.path !== undefined) {
      if (isXboxPath(discovered[gameMode].path)) {
        gameSupport[gameMode].mygamesPath = gameSupportXboxPass[gameMode].mygamesPath;
      }
    }
  })

  if (discovered['enderalspecialedition']?.path !== undefined) {
    if (discovered['enderalspecialedition']?.path.toLowerCase().includes('skyrim')) {
      gameSupport['enderalspecialedition'] = JSON.parse(JSON.stringify(gameSupport['skyrimse']));
    }
  }
}

export function gameSupported(gameMode: string): boolean {
  return gameSupport[gameMode] !== undefined;
}

export function mygamesPath(gameMode: string): string {
  const relPath = (gameStoreForGame(gameMode) === 'gog')
    ? gameSupportGOG[gameMode].mygamesPath
    : gameSupport[gameMode].mygamesPath;

  return path.join(util.getVortexPath('documents'), 'My Games', relPath);
}

export function iniPath(gameMode: string): string {
  const { iniName } = gameSupport[gameMode];
  return path.join(mygamesPath(gameMode), iniName);
}
