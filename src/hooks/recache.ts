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
import path from 'node:path';
import { Hook } from '@oclif/core';
import { Ux } from '@salesforce/sf-plugins-core';
import fs from 'fs-extra';
import { Completion, CompletionLookup } from '../completions.js';

import { updateCache } from '../cache.js';
import acCreate from '../commands/autocmplt/create.js';

export const completions: Hook<'update'> = async function () {
  const ux = new Ux();
  // autocomplete is now in core, skip windows
  if (this.config.windows) return;
  const completionsDir = path.join(this.config.cacheDir, 'autocomplete', 'completions');
  const rm = (): Promise<void> => fs.emptyDir(completionsDir);
  const rmKey = (cacheKey: string): Promise<void> => fs.remove(path.join(completionsDir, cacheKey));

  await rmKey('targetusername');

  const update = async (completion: Completion, cacheKey: string): Promise<void> => {
    const cachePath = path.join(completionsDir, cacheKey);
    const options = await completion.options();
    await updateCache(cachePath, options);
  };

  process.once('beforeExit', () => {
    try {
      ux.spinner.start(`${this.config.bin}-autocmplt: Updating completions`);
      void rm();
      void acCreate.run([], this.config);
      void update(CompletionLookup.targetUserNameCompletion, 'targetusername');
      ux.spinner.stop();
    } catch (err) {
      this.debug((err as Error).message);
    }
  });
};
