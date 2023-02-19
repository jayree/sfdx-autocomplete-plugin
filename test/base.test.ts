/*
 * Copyright (c) 2022, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Config } from '@oclif/core';
import { Flags } from '@salesforce/sf-plugins-core';
import { expect } from 'chai';

// eslint-disable-next-line no-underscore-dangle
const __filename = fileURLToPath(import.meta.url);
// eslint-disable-next-line no-underscore-dangle
const __dirname = dirname(__filename);

import { AutocompleteBase } from '../src/base.js';

class AutocompleteTest extends AutocompleteBase {
  public static id = 'test:foo';
  public static flags = {
    bar: Flags.boolean({
      description: 'bar',
    }),
  };
  // eslint-disable-next-line class-methods-use-this
  public async run() {}
}

const root = resolve(__dirname, '../package.json');
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
    expect(cmd.autocompleteCacheDir).to.eq(join(config.cacheDir, 'autocomplete'));
  });

  it('#completionsCacheDir', async () => {
    expect(cmd.completionsCacheDir).to.eq(join(config.cacheDir, 'autocomplete', 'completions'));
  });

  it('#acLogfilePath', async () => {
    expect(cmd.acLogfilePath).to.eq(join(config.cacheDir, 'autocomplete.log'));
  });

  it('#findCompletion', async () => {
    expect((cmd as any).findCompletion('targetusername')).to.be.ok;
    expect((cmd as any).findCompletion('bar')).to.not.be.ok;
  });
});
