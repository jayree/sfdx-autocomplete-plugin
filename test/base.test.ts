import { Config } from '@oclif/config';
import { expect } from 'chai';
import * as path from 'path';

import { AutocompleteBase } from '../src/base';

// autocomplete will throw error on windows
// const { default: runtest } = _runtest;
// import { skipWindows } from './helpers/runtest';

class AutocompleteTest extends AutocompleteBase {
  public async run() {}
}

const root = path.resolve(__dirname, '../package.json');
const config = new Config({ root });

const cmd = new AutocompleteTest([], config);

// autocomplete will throw error on windows ci
const skipwindows = process.platform === 'win32' ? describe.skip : describe;

skipwindows('autocompleteBase', () => {
  before(async () => {
    await config.load();
    global.config = new Config(config);
    global.config.cacheDir = path.join(__dirname, '../../../../test/assets/cache');
    global.config.bin = 'sfdx';
    await cmd.run();
  });

  it('#errorIfWindows', async () => {
    try {
      cmd.errorIfWindows();
    } catch (e) {
      expect(e.message).to.eq('Autocomplete is not currently supported in Windows');
    }
  });

  it('#errorIfNotSupportedShell', async () => {
    try {
      cmd.errorIfNotSupportedShell('fish');
    } catch (e) {
      expect(e.message).to.eq('fish is not a supported shell for autocomplete');
    }
  });

  it('#autocompleteCacheDir', async () => {
    expect(cmd.autocompleteCacheDir).to.eq(path.join(cmd.sfdxCacheDir, 'autocomplete'));
  });
});
