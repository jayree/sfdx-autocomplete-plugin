"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.completions = void 0;
const tslib_1 = require("tslib");
const cli_ux_1 = tslib_1.__importDefault(require("cli-ux"));
const fs = tslib_1.__importStar(require("fs-extra"));
const path = tslib_1.__importStar(require("path"));
const completions_1 = require("../completions");
const cache_1 = require("../cache");
const create_1 = tslib_1.__importDefault(require("../commands/autocmplt/create"));
// tslint:disable-next-line: no-any
exports.completions = async function ({ type }) {
    // autocomplete is now in core, skip windows
    if (this.config.windows)
        return;
    const completionsDir = path.join(this.config.cacheDir, 'autocomplete', 'completions');
    const rm = () => fs.emptyDir(completionsDir);
    const rmKey = (cacheKey) => fs.remove(path.join(completionsDir, cacheKey));
    if (type === 'targetusername') {
        return rmKey('targetusername');
    }
    // tslint:disable-next-line: no-any
    const update = async (completion, cacheKey) => {
        const cachePath = path.join(completionsDir, cacheKey);
        const options = await completion.options({ config: this.config });
        await cache_1.updateCache(cachePath, options);
    };
    let suppresswarnings;
    const suppresswarningsfile = path.join(this.config.cacheDir, 'sfdx-autocmplt', 'suppresswarnings');
    try {
        suppresswarnings = await fs.readJson(suppresswarningsfile);
    }
    catch (err) {
        suppresswarnings = {
            SuppressUpdateWarning: false
        };
    }
    if (this.config.plugins.filter(p => p.name === '@oclif/plugin-autocomplete').length) {
        if (!suppresswarnings.SuppressUpdateWarning) {
            cli_ux_1.default.styledHeader('sfdx-autocmplt');
            cli_ux_1.default.warn(`'@oclif/plugin-autocomplete' plugin detected!
Use the 'autocmplt' command instead of 'autocomplete' for improved auto-completion.
Run 'sfdx autocmplt --suppresswarnings' to suppress this warning.`);
        }
    }
    else {
        if (suppresswarnings.SuppressUpdateWarning) {
            try {
                await fs.ensureFile(suppresswarningsfile);
                await fs.writeJson(suppresswarningsfile, {
                    SuppressUpdateWarning: false
                });
            }
            catch (error) { }
        }
    }
    cli_ux_1.default.action.start('Updating completions');
    await rm();
    await create_1.default.run([], this.config);
    try {
        await update(completions_1.targetUserNameCompletion, 'targetusername');
    }
    catch (err) {
        this.debug(err.message);
    }
    cli_ux_1.default.action.stop();
};
//# sourceMappingURL=recache.js.map