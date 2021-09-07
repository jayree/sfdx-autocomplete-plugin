import * as path from 'path';
import { Config } from '@oclif/config';
import { flags } from '@salesforce/command';
import { expect } from 'chai';

import { AutocompleteBase } from '../src/base';

// autocomplete will throw error on windows
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { default: runtest } = require('./helpers/runtest');

class AutocompleteTest extends AutocompleteBase {
  public static id = 'test:foo';
  protected static flagsConfig = {
    bar: flags.boolean({
      description: 'bar',
    }),
  };
  public async run() {}
}

const root = path.resolve(__dirname, '../package.json');
const config = new Config({ root });

const cmd = new AutocompleteTest([], config);

runtest('AutocompleteBase', () => {
  before(async () => {
    await config.load();
  });

  it('#errorIfWindows', async () => {
    try {
      new AutocompleteTest([], config).errorIfWindows();
    } catch (e) {
      expect(e.message).to.eq('Autocomplete is not currently supported in Windows');
    }
  });

  it('#autocompleteCacheDir', async () => {
    expect(cmd.autocompleteCacheDir).to.eq(path.join(config.cacheDir, 'autocomplete'));
  });

  it('#completionsCacheDir', async () => {
    expect(cmd.completionsCacheDir).to.eq(path.join(config.cacheDir, 'autocomplete', 'completions'));
  });

  it('#acLogfilePath', async () => {
    expect(cmd.acLogfilePath).to.eq(path.join(config.cacheDir, 'autocomplete.log'));
  });

  it('#findCompletion', async () => {
    // tslint:disable-next-line: no-any
    expect((cmd as any).findCompletion(AutocompleteTest.id, 'targetusername')).to.be.ok;
    // tslint:disable-next-line: no-any
    expect((cmd as any).findCompletion(AutocompleteTest.id, 'bar')).to.not.be.ok;
  });
});
