/*
 * Copyright 2025, jayree
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

import { Args } from '@oclif/core';
import { AutocompleteBase } from '../../base.js';

export default class Script extends AutocompleteBase {
  public static aliases = ['autocomplete:script'];

  public static readonly description = 'display autocomplete setup script for shell';
  public static hidden = true;

  public static args = {
    shell: Args.string({ description: 'shell type', required: true }),
  };

  private get prefix(): string {
    return `\n# ${this.config.bin} autocomplete setup\n`;
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  public async run(): Promise<void> {
    const { args } = await this.parse(Script);
    const shell: string = args.shell;
    this.errorIfNotSupportedShell(shell);

    const shellUpcase = shell.toUpperCase();
    const bin = this.cliBinEnvVar;
    this.log(
      `${this.prefix}${bin}_AC_${shellUpcase}_SETUP_PATH=${path.join(
        this.autocompleteCacheDir,
        `${shell}_setup`,
      )} && test -f $${bin}_AC_${shellUpcase}_SETUP_PATH && source $${bin}_AC_${shellUpcase}_SETUP_PATH;`,
    );
  }
}
