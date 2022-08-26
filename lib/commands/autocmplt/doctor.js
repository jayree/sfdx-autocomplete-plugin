/*
 * Copyright (c) 2022, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import path from 'path';
import { flags } from '@salesforce/command';
import fs from 'fs-extra';
import { AutocompleteBase } from '../../base.js';
export default class Doctor extends AutocompleteBase {
    async run() {
        const shell = this.args.shell || this.config.shell;
        this.errorIfNotSupportedShell(shell);
        const data = [];
        // cli version
        data.push({
            name: 'cli version',
            value: this.config.version,
        });
        // plugin version
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const pjson = await fs.readJson(path.resolve(new URL('./', import.meta.url).pathname, '..', '..', '..', 'package.json'));
        data.push({
            name: 'plugin version',
            value: pjson.version,
        });
        // check shell shim source env var
        // i.e. SFDX_AC_<shell>_SETUP_PATH
        const shellProfilePath = path.join(process.env.HOME || '', shell === 'zsh' ? '.zshrc' : '.bashrc');
        const shellProfile = fs.readFileSync(shellProfilePath);
        const regex = /AC_\w+_SETUP_PATH/;
        const shimVlaue = regex.exec(shellProfile.toString()) ? 'present' : 'missing';
        data.push({
            name: `~/${shell === 'zsh' ? '.zshrc' : '.bashrc'} shimmed`,
            value: shimVlaue,
        });
        // check shell shim
        const shellCompletion = path.join(this.autocompleteCacheDir, `${shell}_setup`);
        const shellCompletionValue = fs.existsSync(shellCompletion) ? 'present' : 'missing';
        data.push({
            name: `${shell} shim file`,
            value: shellCompletionValue,
        });
        // check shell command cache
        const shellCmdCache = path.join(this.autocompleteCacheDir, shell === 'zsh' ? 'commands_setters' : 'commands');
        const shellCmdCacheValue = fs.existsSync(shellCmdCache) ? 'present' : 'missing';
        data.push({
            name: `${shell} commands cache`,
            value: shellCmdCacheValue,
        });
        // check app completion cache
        const targetusernamesCache = path.join(this.completionsCacheDir, 'targetusername');
        let targetusernamesCacheValue;
        if (fs.existsSync(targetusernamesCache)) {
            const length = fs.readJSONSync(targetusernamesCache).length;
            targetusernamesCacheValue = length ? length : 'empty';
        }
        else {
            targetusernamesCacheValue = 'missing';
        }
        data.push({
            name: 'targetusernames completion cache',
            value: targetusernamesCacheValue,
        });
        this.ux.table(data, {
            name: {},
            value: {},
        }, { 'no-header': true });
        if (this.flags.debug)
            this.printList();
    }
    printList() {
        this.log();
        const header = 'Completable Commands';
        this.log(header);
        this.log('='.repeat(header.length));
        this.config.plugins.map((p) => {
            p.commands.map((c) => {
                try {
                    if (c.hidden) {
                        this.log(`${c.id} (hidden)`);
                    }
                    else {
                        const results = Object.keys(c.flags).map((f) => {
                            let out = `--${f}`;
                            const flag = c.flags[f];
                            if (flag.type === 'option') {
                                out += '=';
                            }
                            // eslint-disable-next-line no-prototype-builtins
                            if (flag.hasOwnProperty('completion') || this.findCompletion(c.id, f, flag.description)) {
                                out += '(c)';
                            }
                            if (flag.hidden)
                                out += '(h)';
                            return out;
                        });
                        if (results.length) {
                            // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
                            this.log(`${c.id} -> ${results}`);
                        }
                    }
                }
                catch {
                    this.log(`Error creating autocomplete for command ${c.id}`);
                }
            });
        });
    }
}
Doctor.aliases = ['autocomplete:doctor'];
Doctor.hidden = true;
Doctor.description = 'autocomplete diagnostic';
Doctor.args = [
    {
        name: 'shell',
        description: 'shell type',
        required: false,
    },
];
Doctor.flagsConfig = {
    debug: flags.boolean({
        description: 'list completable commands',
    }),
};
//# sourceMappingURL=doctor.js.map