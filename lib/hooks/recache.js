"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.completions = void 0;
const path = require("path");
const core_1 = require("@oclif/core");
const fs = require("fs-extra");
const completions_1 = require("../completions");
const cache_1 = require("../cache");
const create_1 = require("../commands/autocmplt/create");
// tslint:disable-next-line: no-any
const completions = async function () {
    // autocomplete is now in core, skip windows
    if (this.config.windows)
        return;
    const completionsDir = path.join(this.config.cacheDir, 'autocomplete', 'completions');
    const rm = () => fs.emptyDir(completionsDir);
    const rmKey = (cacheKey) => fs.remove(path.join(completionsDir, cacheKey));
    await rmKey('targetusername');
    // tslint:disable-next-line: no-any
    const update = async (completion, cacheKey) => {
        const cachePath = path.join(completionsDir, cacheKey);
        const options = await completion.options({ config: this.config });
        await (0, cache_1.updateCache)(cachePath, options);
    };
    let suppresswarnings;
    const suppresswarningsfile = path.join(this.config.cacheDir, 'sfdx-autocmplt', 'suppresswarnings');
    try {
        suppresswarnings = await fs.readJson(suppresswarningsfile);
    }
    catch (err) {
        suppresswarnings = {
            SuppressUpdateWarning: false,
        };
    }
    if (this.config.plugins.filter((p) => p.name === '@oclif/plugin-autocomplete').length) {
        if (!suppresswarnings.SuppressUpdateWarning) {
            core_1.CliUx.ux.styledHeader('sfdx-autocmplt');
            core_1.CliUx.ux.warn(`'@oclif/plugin-autocomplete' plugin detected!
Use the 'autocmplt' command instead of 'autocomplete' for improved auto-completion.
Run 'sfdx autocmplt --suppresswarnings' to suppress this warning.`);
        }
    }
    else {
        if (suppresswarnings.SuppressUpdateWarning) {
            try {
                await fs.ensureFile(suppresswarningsfile);
                await fs.writeJson(suppresswarningsfile, {
                    SuppressUpdateWarning: false,
                });
                // eslint-disable-next-line no-empty
            }
            catch (error) { }
        }
    }
    process.once('beforeExit', () => {
        core_1.CliUx.ux.action.start('sfdx-autocmplt: Updating completions');
        void rm();
        void create_1.default.run([], this.config);
        try {
            void update(completions_1.targetUserNameCompletion, 'targetusername');
        }
        catch (err) {
            this.debug(err.message);
        }
        core_1.CliUx.ux.action.stop();
    });
};
exports.completions = completions;
//# sourceMappingURL=recache.js.map