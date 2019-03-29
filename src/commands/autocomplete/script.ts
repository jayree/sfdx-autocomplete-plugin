import * as path from 'path';

import { AutocompleteBase } from '../../base';

export default class Script extends AutocompleteBase {
  public static description = 'display autocomplete setup script for shell';
  public static hidden = true;
  public static args = [{ name: 'shell', description: 'shell type', required: true }];

  public async run() {
    const shell = this.args.shell || this.config.shell;
    this.errorIfNotSupportedShell(shell);

    const shellUpcase = shell.toUpperCase();
    this.log(
      `${this.prefix}SFDX_AC_${shellUpcase}_SETUP_PATH=${path.join(
        this.autocompleteCacheDir,
        `${shell}_setup`
      )} && test -f $SFDX_AC_${shellUpcase}_SETUP_PATH && source $SFDX_AC_${shellUpcase}_SETUP_PATH;`
    );
  }

  private get prefix(): string {
    return `\n# ${this.config.bin} autocomplete setup\n`;
  }
}
