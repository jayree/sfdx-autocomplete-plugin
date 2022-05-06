"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const command_1 = require("@salesforce/command");
const chalk = require("chalk");
const fs = require("fs-extra");
const completions_1 = require("../../completions");
const base_1 = require("../../base");
const cache_1 = require("../../cache");
const create_1 = require("./create");
class Index extends base_1.AutocompleteBase {
    async run() {
        const shell = this.args.shell || this.config.shell;
        this.errorIfNotSupportedShell(shell);
        this.ux.startSpinner(`${chalk.bold('Building the autocomplete cache')}`);
        await create_1.default.run([], this.config);
        await this.updateCache(completions_1.targetUserNameCompletion, 'targetusername');
        this.ux.stopSpinner();
        if (!this.flags['refresh-cache']) {
            const bin = this.config.bin;
            const bashNote = 'If your terminal starts as a login shell you may need to print the init script into ~/.bash_profile or ~/.profile.';
            const zshNote = `After sourcing, you can run \`${chalk.cyan('$ compaudit -D')}\` to ensure no permissions conflicts are present`;
            const fishNote = 'This assumes your Fish configuration is stored at ~/.config/fish/config.fish';
            const note = shell === 'zsh' ? zshNote : shell === 'bash' ? bashNote : fishNote;
            const tabStr = shell === 'bash' ? '<TAB><TAB>' : '<TAB>';
            const addStr = shell === 'fish'
                ? `Update your shell to load the new completions
${chalk.cyan('$ source ~/.config/fish/config.fish')}`
                : `Add the autocomplete env var to your ${shell} profile and source it
${chalk.cyan(`$ printf "$(${bin} autocmplt:script ${shell})" >> ~/.${shell}rc; source ~/.${shell}rc`)}`;
            this.log(`
${chalk.bold(`Setup Instructions for ${bin.toUpperCase()} CLI Autocomplete ---`)}

1) ${addStr}

NOTE: ${note}

2) Test it out, e.g.:
${chalk.cyan(`$ ${bin} ${tabStr}`)}                 # Command completion
${chalk.cyan(`$ ${bin} apps:info --${tabStr}`)}     # Flag completion
${chalk.cyan(`$ ${bin} apps:info --app=${tabStr}`)} # Flag option completion

Enjoy!
`);
        }
        if (this.flags.suppresswarnings) {
            try {
                const suppresswarningsfile = path.join(this.config.cacheDir, 'sfdx-autocmplt', 'suppresswarnings');
                await fs.ensureFile(suppresswarningsfile);
                await fs.writeJson(suppresswarningsfile, {
                    SuppressUpdateWarning: true,
                });
            }
            catch (error) {
                this.logger.error(error);
            }
        }
    }
    // tslint:disable-next-line: no-any
    async updateCache(completion, cacheKey) {
        const cachePath = path.join(this.completionsCacheDir, cacheKey);
        const options = await completion.options({
            config: this.config,
        });
        await (0, cache_1.updateCache)(cachePath, options);
    }
}
exports.default = Index;
Index.description = 'display autocomplete installation instructions';
Index.args = [
    {
        name: 'shell',
        description: 'shell type',
        required: false,
    },
];
Index.examples = [
    '$ sfdx autocmplt',
    '$ sfdx autocmplt bash',
    '$ sfdx autocmplt zsh',
    '$ sfdx autocmplt fish',
    '$ sfdx autocmplt --refresh-cache',
];
Index.flagsConfig = {
    'refresh-cache': command_1.flags.boolean({
        description: 'refresh cache only (ignores displaying instructions)',
        char: 'r',
    }),
    suppresswarnings: command_1.flags.boolean({
        description: 'suppress warnings',
        hidden: true,
    }),
};
//# sourceMappingURL=index.js.map