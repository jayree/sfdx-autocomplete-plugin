/*
 * Copyright (c) 2022, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import path from 'path';
import { Hook } from '@oclif/core';
import { CliUx } from '@oclif/core';
import fs from 'fs-extra';
import { targetUserNameCompletion } from '../completions.js';

import { updateCache } from '../cache.js';
import acCreate from '../commands/autocmplt/create.js';

// tslint:disable-next-line: no-any
export const completions: Hook<any> = async function () {
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

  let suppresswarnings;

  const suppresswarningsfile = path.join(this.config.cacheDir, `${this.config.bin}-autocmplt`, 'suppresswarnings');

  try {
    suppresswarnings = await fs.readJson(suppresswarningsfile);
  } catch (err) {
    suppresswarnings = {
      SuppressUpdateWarning: false,
    };
  }

  if (this.config.plugins.filter((p) => p.name === '@oclif/plugin-autocomplete').length) {
    if (!suppresswarnings.SuppressUpdateWarning) {
      CliUx.ux.styledHeader(`${this.config.bin}-autocmplt`);
      CliUx.ux.warn(
        `'@oclif/plugin-autocomplete' plugin detected!
Use the 'autocmplt' command instead of 'autocomplete' for improved auto-completion.
Run '${this.config.bin} autocmplt --suppresswarnings' to suppress this warning.`
      );
    }
  } else if (suppresswarnings.SuppressUpdateWarning) {
    try {
      await fs.ensureFile(suppresswarningsfile);
      await fs.writeJson(suppresswarningsfile, {
        SuppressUpdateWarning: false,
      });
      // eslint-disable-next-line no-empty
    } catch (error) {}
  }

  process.once('beforeExit', () => {
    CliUx.ux.action.start(`${this.config.bin}-autocmplt: Updating completions`);
    void rm();
    void acCreate.run([], this.config);

    try {
      void update(targetUserNameCompletion, 'targetusername');
    } catch (err) {
      this.debug(err.message);
    }
    CliUx.ux.action.stop();
  });
};
