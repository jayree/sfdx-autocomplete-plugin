/*
 * Copyright (c) 2022, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
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
    ux.spinner.start(`${this.config.bin}-autocmplt: Updating completions`);
    void rm();
    void acCreate.run([], this.config);

    try {
      void update(CompletionLookup.targetUserNameCompletion, 'targetusername');
    } catch (err) {
      this.debug((err as Error).message);
    }
    ux.spinner.stop();
  });
};
