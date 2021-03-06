"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const command_1 = require("@salesforce/command");
const chalk_1 = tslib_1.__importDefault(require("chalk"));
const cli_ux_1 = require("cli-ux");
const fs = tslib_1.__importStar(require("fs-extra"));
const path = tslib_1.__importStar(require("path"));
const completions_1 = require("../../completions");
const base_1 = require("../../base");
const cache_1 = require("../../cache");
const create_1 = tslib_1.__importDefault(require("./create"));
class Index extends base_1.AutocompleteBase {
    async run() {
        const shell = this.args.shell || this.config.shell;
        this.errorIfNotSupportedShell(shell);
        cli_ux_1.cli.action.start(`${chalk_1.default.bold('Building the autocomplete cache')}`);
        await create_1.default.run([], this.config);
        await this.updateCache(completions_1.targetUserNameCompletion, 'targetusername');
        cli_ux_1.cli.action.stop();
        if (!this.flags['refresh-cache']) {
            const bin = this.config.bin;
            const bashNote = 'If your terminal starts as a login shell you may need to print the init script into ~/.bash_profile or ~/.profile.';
            const zshNote = `After sourcing, you can run \`${chalk_1.default.cyan('$ compaudit -D')}\` to ensure no permissions conflicts are present`;
            const fishNote = 'This assumes your Fish configuration is stored at ~/.config/fish/config.fish';
            const note = shell === 'zsh' ? zshNote : shell === 'bash' ? bashNote : fishNote;
            const tabStr = shell === 'bash' ? '<TAB><TAB>' : '<TAB>';
            const addStr = shell === 'fish'
                ? `Update your shell to load the new completions
${chalk_1.default.cyan('$ source ~/.config/fish/config.fish')}`
                : `Add the autocomplete env var to your ${shell} profile and source it
${chalk_1.default.cyan(`$ printf "$(${bin} autocmplt:script ${shell})" >> ~/.${shell}rc; source ~/.${shell}rc`)}`;
            this.log(`
${chalk_1.default.bold(`Setup Instructions for ${bin.toUpperCase()} CLI Autocomplete ---`)}

1) ${addStr}

NOTE: ${note}

2) Test it out, e.g.:
${chalk_1.default.cyan(`$ ${bin} ${tabStr}`)}                 # Command completion
${chalk_1.default.cyan(`$ ${bin} apps:info --${tabStr}`)}     # Flag completion
${chalk_1.default.cyan(`$ ${bin} apps:info --app=${tabStr}`)} # Flag option completion

Enjoy!
`);
        }
        if (this.flags.suppresswarnings) {
            try {
                const suppresswarningsfile = path.join(this.config.cacheDir, 'sfdx-autocmplt', 'suppresswarnings');
                await fs.ensureFile(suppresswarningsfile);
                await fs.writeJson(suppresswarningsfile, {
                    SuppressUpdateWarning: true
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
            config: this.config
        });
        await cache_1.updateCache(cachePath, options);
    }
}
exports.default = Index;
Index.description = 'display autocomplete installation instructions';
Index.args = [
    {
        name: 'shell',
        description: 'shell type',
        required: false
    }
];
Index.examples = [
    '$ sfdx autocmplt',
    '$ sfdx autocmplt bash',
    '$ sfdx autocmplt zsh',
    '$ sfdx autocmplt fish',
    '$ sfdx autocmplt --refresh-cache'
];
Index.flagsConfig = {
    'refresh-cache': command_1.flags.boolean({
        description: 'refresh cache only (ignores displaying instructions)',
        char: 'r'
    }),
    suppresswarnings: command_1.flags.boolean({
        description: 'suppress warnings',
        hidden: true
    })
};
//# sourceMappingURL=index.js.map