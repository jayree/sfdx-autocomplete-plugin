"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const path = tslib_1.__importStar(require("path"));
const base_1 = require("../../base");
class Script extends base_1.AutocompleteBase {
    async run() {
        const shell = this.args.shell;
        this.errorIfNotSupportedShell(shell);
        const shellUpcase = shell.toUpperCase();
        this.log(`${this.prefix}SFDX_AC_${shellUpcase}_SETUP_PATH=${path.join(this.autocompleteCacheDir, `${shell}_setup`)} && test -f $SFDX_AC_${shellUpcase}_SETUP_PATH && source $SFDX_AC_${shellUpcase}_SETUP_PATH;`);
    }
    get prefix() {
        return `\n# ${this.config.bin} autocomplete setup\n`;
    }
}
exports.default = Script;
Script.aliases = ['autocomplete:script'];
Script.description = 'display autocomplete setup script for shell';
Script.hidden = true;
Script.args = [{ name: 'shell', description: 'shell type', required: true }];
//# sourceMappingURL=script.js.map