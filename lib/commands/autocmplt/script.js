/*
 * Copyright (c) 2022, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import path from 'node:path';
import { AutocompleteBase } from '../../base.js';
export default class Script extends AutocompleteBase {
    get prefix() {
        return `\n# ${this.config.bin} autocomplete setup\n`;
    }
    // eslint-disable-next-line @typescript-eslint/require-await
    async run() {
        const { args } = await this.parse(Script);
        const shell = args.shell;
        this.errorIfNotSupportedShell(shell);
        const shellUpcase = shell.toUpperCase();
        const bin = this.cliBinEnvVar;
        this.log(`${this.prefix}${bin}_AC_${shellUpcase}_SETUP_PATH=${path.join(this.autocompleteCacheDir, `${shell}_setup`)} && test -f $${bin}_AC_${shellUpcase}_SETUP_PATH && source $${bin}_AC_${shellUpcase}_SETUP_PATH;`);
    }
}
Script.aliases = ['autocomplete:script'];
Script.description = 'display autocomplete setup script for shell';
Script.hidden = true;
Script.args = [{ name: 'shell', description: 'shell type', required: true }];
//# sourceMappingURL=script.js.map