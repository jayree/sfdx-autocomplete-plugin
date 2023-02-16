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
import { targetUserNameCompletion } from '../completions.js';

import { updateCache } from '../cache.js';
import acCreate from '../commands/autocmplt/create.js';

// tslint:disable-next-line: no-any
export const completions: Hook<any> = async function () {
  const ux = new Ux();
  // autocomplete is now in core, skip windows
  if (this.config.windows) return;
  const completionsDir = path.join(this.config.cacheDir, 'autocomplete', 'completions');
  const rm = () => fs.emptyDir(completionsDir);
  const rmKey = (cacheKey: string) => fs.remove(path.join(completionsDir, cacheKey));

  await rmKey('targetusername');

  // tslint:disable-next-line: no-any
  const update = async (completion: any, cacheKey: string) => {
    const cachePath = path.join(completionsDir, cacheKey);
    const options = await completion.options({ config: this.config });
    await updateCache(cachePath, options);
  };

  process.once('beforeExit', () => {
    ux.spinner.start(`${this.config.bin}-autocmplt: Updating completions`);
    void rm();
    void acCreate.run([], this.config);

    try {
      void update(targetUserNameCompletion, 'targetusername');
    } catch (err) {
      this.debug(err.message);
    }
    ux.spinner.stop();
  });
};
