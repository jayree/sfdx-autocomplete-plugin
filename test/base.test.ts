/*
 * Copyright (c) 2022, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import path from 'path';
import { Config } from '@oclif/core';
import { flags } from '@salesforce/command';
import { expect } from 'chai';

import { AutocompleteBase } from '../src/base.js';

class AutocompleteTest extends AutocompleteBase {
  public static id = 'test:foo';
  protected static flagsConfig = {
    bar: flags.boolean({
      description: 'bar',
    }),
  };
  // eslint-disable-next-line class-methods-use-this
  public async run() {}
}

const root = path.resolve(new URL('./', import.meta.url).pathname, '../package.json');
const config = new Config({ root });

const cmd = new AutocompleteTest([], config);

describe('AutocompleteBase', () => {
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
