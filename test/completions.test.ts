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
    const c = new CompletionLookup('app').run();
    expect(c).to.eq(CompletionMapping.app);
  });

  it('does not find foo completion', async () => {
    const c = new CompletionLookup('foo').run();
    expect(c).to.not.be.ok;
  });
});
