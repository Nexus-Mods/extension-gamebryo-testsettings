import * as Promise from 'bluebird';
import * as path from 'path';
import * as Redux from 'redux';
import { fs, selectors, types } from 'vortex-api';
import { IniFile } from 'vortex-parse-ini';

export const oblivionDefaultFonts = {
  SFontFile_1: 'Data\\Fonts\\Kingthings_Regular.fnt',
  SFontFile_2: 'Data\\Fonts\\Kingthings_Shadowed.fnt',
  SFontFile_3: 'Data\\Fonts\\Tahoma_Bold_Small.fnt',
  SFontFile_4: 'Data\\Fonts\\Daedric_Font.fnt',
  SFontFile_5: 'Data\\Fonts\\Handwritten.fnt',
};

function missingOblivionFont(store: Redux.Store<types.IState>,
                             iniFile: IniFile<any>,
                             gameId: string): Promise<string[]> {
  const discovery: types.IDiscoveryResult = selectors.discoveryByGame(store.getState(), gameId);
  if ((discovery === undefined) || (discovery.path === undefined)) {
    // not this extensions job to report game not being discovered
    return Promise.resolve([]);
  }

  const missingFonts: string[] = [];

  const fonts: string[] = [];
  Object.keys(iniFile.data.Fonts || {})
      .forEach((key: string) => {
        if (oblivionDefaultFonts[key] !== iniFile.data.Fonts[key]) {
          fonts.push(iniFile.data.Fonts[key]);
        }
      });

  return Promise.each(fonts, (font: string) =>
    fs.statAsync(path.join(discovery.path, font))
      .catch(() => { missingFonts.push(font); }))
  .then(() => Promise.resolve(missingFonts));
}

export default missingOblivionFont;
