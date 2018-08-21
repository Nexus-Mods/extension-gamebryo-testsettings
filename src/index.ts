import { iniPath } from './util/gameSupport';
import missingOblivionFont, { oblivionDefaultFonts } from './util/missingOblivionFonts';
import missingSkyrimFonts from './util/missingSkyrimFonts';

import * as Promise from 'bluebird';
import * as path from 'path';
import * as Redux from 'redux';
import { fs, selectors, types, util } from 'vortex-api';
import IniParser, { IniFile, WinapiFormat } from 'vortex-parse-ini';

const parser = new IniParser(new WinapiFormat());

function fixOblivionFonts(iniFile: IniFile<any>, missingFonts: string[], gameId: string): Promise<void> {
  return new Promise<void>((fixResolve, fixReject) => {
    Object.keys(iniFile.data.Fonts)
        .forEach((key) => {
          if (missingFonts.find((item) => {
                return item === iniFile.data.Fonts[key];
              }) !== undefined) {
            if (oblivionDefaultFonts[key] !== undefined) {
              iniFile.data.Fonts[key] = oblivionDefaultFonts[key];
            } else {
              delete iniFile.data.Fonts[key];
            }
          }
        });

    parser.write(iniPath(gameId), iniFile);
    fixResolve();
  });
}

function testOblivionFontsImpl(store: Redux.Store<types.IState>) {
  const gameId = selectors.activeGameId(store.getState());

  if (gameId !== 'oblivion') {
    return Promise.resolve(undefined);
  }

  let iniFile: IniFile<any>;

  return parser.read(iniPath(gameId))
  .then((iniFileIn: IniFile<any>) => {
    iniFile = iniFileIn;
    return missingOblivionFont(store, iniFile, gameId);
  })
  .then((missingFonts: string[]) => {

    if (missingFonts.length === 0) {
      return Promise.resolve(undefined);
    }

    const fontList = missingFonts.join('\n');

    return Promise.resolve({
      description: {
        short: 'Fonts missing.',
        long:
            'Fonts referenced in oblivion.ini don\'t seem to be installed:\n' +
                fontList,
      },
      severity: 'error' as types.ProblemSeverity,
      automaticFix: () => fixOblivionFonts(iniFile, missingFonts, gameId),
    });
  })
  .catch((err: Error) =>
    Promise.resolve({
      description: {
        short: 'Failed to read Oblivion.ini.',
        long: err.toString(),
      },
      severity: 'error' as types.ProblemSeverity,
    }));
}

const defaultFonts: { [gameId: string]: Set<string> } = {};

function testSkyrimFontsImpl(context: types.IExtensionContext) {
  const store = context.api.store;
  const gameId = selectors.activeGameId(store.getState());

  const gameDiscovery: types.IDiscoveryResult = util.getSafe(store.getState(),
    ['settings', 'gameMode', 'discovered', gameId], undefined);

  if ((gameId !== 'skyrim') && (gameId !== 'skyrimse') && (gameId !== 'skyrimvr')) {
    return Promise.resolve(undefined);
  }

  if ((gameDiscovery === undefined) || (gameDiscovery.path === undefined)) {
    return Promise.resolve(undefined);
  }

  const game = util.getGame(gameId);

  const interfacePath = path.join(game.getModPaths(gameDiscovery.path)[''],
                                  'Skyrim - Interface.bsa');

  const prom = defaultFonts[gameId] !== undefined
    ? Promise.resolve(undefined)
    : context.api.openArchive(interfacePath)
    .then((archive: util.Archive) => archive.readDir('interface'))
    .then((files: string[]) => {
      defaultFonts[gameId] = new Set<string>(files
        .filter(name => path.extname(name) === '.swf')
        .map(name => path.join('interface', name)));
    })
    .catch((err: Error) => {
      return fs.statAsync(interfacePath)
        .then(() => {
          context.api.showErrorNotification('Failed to read default fonts', {
            filePath: interfacePath,
            error: err,
          });
          return Promise.reject(new Error('default fonts unknown'));
        })
        .catch(statErr => {
          context.api.showErrorNotification('"Skyrim - Interface.bsa" appears to be missing', err, {
            allowReport: false,
          });
          return Promise.reject(new Error('default fonts unknown'));
        });
    });

  return prom
    .then(() => missingSkyrimFonts(store.getState(), defaultFonts[gameId], gameId))
    .then((missingFonts: string[]) => {

      if (missingFonts.length === 0) {
        return Promise.resolve(undefined);
      }

      const fontList = missingFonts.join('\n');

      return Promise.resolve({
        description: {
          short: 'Fonts missing.',
          long:
          'Fonts referenced in fontconfig.txt don\'t seem to be installed:\n' +
          fontList,
        },
        severity: 'error' as types.ProblemSeverity,
      });
    })
    .catch((err: Error) => {
      return Promise.resolve({
        description: {
          short: 'Failed to read fontconfig.txt.',
          long: err.toString(),
        },
        severity: 'error' as types.ProblemSeverity,
      });
    });
}

function init(context: types.IExtensionContext): boolean {
  const testOblivionFonts = (): Promise<types.ITestResult> =>
    testOblivionFontsImpl(context.api.store);

  const testSkyrimFonts = (): Promise<types.ITestResult> => testSkyrimFontsImpl(context);

  context.registerTest('oblivion-fonts', 'gamemode-activated', testOblivionFonts);
  context.registerTest('skyrim-fonts', 'gamemode-activated', testSkyrimFonts);

  return true;
}

export default init;
