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
    const shell: string = this.args.shell;
    this.errorIfNotSupportedShell(shell);

    const shellUpcase = shell.toUpperCase();
    this.log(
      `${this.prefix}SFDX_AC_${shellUpcase}_SETUP_PATH=${path.join(
        this.autocompleteCacheDir,
        `${shell}_setup`
      )} && test -f $SFDX_AC_${shellUpcase}_SETUP_PATH && source $SFDX_AC_${shellUpcase}_SETUP_PATH;`
    );
  }
}
