"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cli_ux_1 = require("cli-ux");
const fs = require("fs-extra");
const path = require("path");
const completions_1 = require("../completions");
const cache_1 = require("../cache");
const create_1 = require("../commands/autocomplete/create");
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