/*
 * Copyright (c) 2022, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { expect } from 'chai';

import { CompletionLookup, CompletionMapping } from '../src/completions.js';

describe('CompletionLookup', () => {
  it('finds completion', async () => {
    const c = new CompletionLookup('cmdId', 'app', 'app to use').run();
    expect(c).to.eq(CompletionMapping.app);
  });

  it('finds completion via command arg lookup', async () => {
    const c = new CompletionLookup('config:set', 'key', '').run();
    expect(c).to.eq(CompletionMapping.configSet);
  });

  it('finds completion via alias lookup', async () => {
    const c = new CompletionLookup('config:get', 'key', '').run();
    expect(c).to.eq(CompletionMapping.config);
  });

  it('finds completion via description lookup', async () => {
    const c = new CompletionLookup('cmdId', 'size', 'dyno size to use').run();
    expect(c).to.eq(CompletionMapping.dynosize);
  });

  it('does not find foo completion', async () => {
    const c = new CompletionLookup('cmdId', 'foo', 'foo to use').run();
    expect(c).to.not.be.ok;
  });

  /*   it('does not find blacklisted completion', async () => {
    const c = new CompletionLookup('apps:create', 'app', 'app to use').run();
    expect(c).to.not.be.ok;
  }); */
});
