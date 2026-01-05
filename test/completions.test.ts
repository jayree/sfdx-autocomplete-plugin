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
import { expect } from 'chai';

import { CompletionLookup } from '../src/completions.js';

describe('CompletionLookup', () => {
  it('finds completion', async () => {
    const c = new CompletionLookup('targetusername').run();
    expect(c).to.eq(new CompletionLookup().CompletionMapping.targetusername);
  });

  it('does not find foo completion', async () => {
    const c = new CompletionLookup('foo').run();
    expect(c).to.not.be.ok;
  });
});
