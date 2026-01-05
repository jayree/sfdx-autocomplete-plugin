/*
 * Copyright 2026, jayree
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
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
    } catch (err) {
      expect((err as Error).message).to.eq('Autocomplete is not currently supported in Windows');
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
    expect(cmd.findCompletion('targetusername')).to.be.ok;
    expect(cmd.findCompletion('bar')).to.not.be.ok;
  });
});
