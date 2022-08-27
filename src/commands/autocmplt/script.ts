/*
 * Copyright (c) 2022, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import path from 'path';

import { AutocompleteBase } from '../../base.js';

export default class Script extends AutocompleteBase {
  public static aliases = ['autocomplete:script'];

  public static description = 'display autocomplete setup script for shell';
  public static hidden = true;
  public static args = [{ name: 'shell', description: 'shell type', required: true }];

  private get prefix(): string {
    return `\n# ${this.config.bin} autocomplete setup\n`;
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  public async run() {
    const { args } = await this.parse(Script);
    const shell: string = args.shell;
    this.errorIfNotSupportedShell(shell);

    const shellUpcase = shell.toUpperCase();
    const bin = this.cliBinEnvVar;
    this.log(
      `${this.prefix}${bin}_AC_${shellUpcase}_SETUP_PATH=${path.join(
        this.autocompleteCacheDir,
        `${shell}_setup`
      )} && test -f $${bin}_AC_${shellUpcase}_SETUP_PATH && source $${bin}_AC_${shellUpcase}_SETUP_PATH;`
    );
  }
}
