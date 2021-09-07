"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AutocompleteBase = void 0;
const path = require("path");
const command_1 = require("@salesforce/command");
const fs = require("fs-extra");
const cache_1 = require("./cache");
const completions_1 = require("./completions");
class AutocompleteBase extends command_1.SfdxCommand {
    constructor() {
        super(...arguments);
        this.parsedArgs = {};
        this.parsedFlags = {};
    }
    errorIfWindows() {
        if (this.config.windows) {
            throw new Error('Autocomplete is not currently supported in Windows');
        }
    }
    errorIfNotSupportedShell(shell) {
        if (!shell) {
            this.error('Missing required argument shell');
        }
        this.errorIfWindows();
        if (!['bash', 'zsh', 'fish'].includes(shell)) {
            throw new Error(`${shell} is not a supported shell for autocomplete`);
        }
    }
    get autocompleteCacheDir() {
        return path.join(this.config.cacheDir, 'autocomplete');
    }
    get completionsCacheDir() {
        return path.join(this.config.cacheDir, 'autocomplete', 'completions');
    }
    get acLogfilePath() {
        return path.join(this.config.cacheDir, 'autocomplete.log');
    }
    writeLogFile(msg) {
        const now = new Date();
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        const entry = `[${now}] ${msg}\n`;
        const fd = fs.openSync(this.acLogfilePath, 'a');
        fs.writeSync(fd, entry);
    }
    // tslint:disable-next-line: no-any
    async fetchOptions(cache) {
        const { cacheCompletion, cacheKey } = cache;
        // build/retrieve & return options cache
        if (cacheCompletion && cacheCompletion.options) {
            const ctx = {
                args: this.parsedArgs,
                flags: this.parsedFlags,
                argv: this.argv,
                config: this.config,
            };
            // use cacheKey function or fallback to arg/flag name
            const ckey = cacheCompletion.cacheKey ? await cacheCompletion.cacheKey(ctx) : null;
            const key = ckey || cacheKey || 'unknown_key_error';
            const flagCachePath = path.join(this.completionsCacheDir, key);
            // build/retrieve cache
            const duration = cacheCompletion.cacheDuration || 60 * 60 * 24; // 1 day
            const skip = cacheCompletion.skipCache || false;
            const opts = { cacheFn: () => cacheCompletion.options(ctx) };
            const options = await (0, cache_1.fetchCache)(flagCachePath, duration, skip, opts);
            // return options cache
            return (options || []).join('\n');
        }
    }
    findCompletion(cmdId, name, description = '') {
        return new completions_1.CompletionLookup(cmdId, name, description).run();
    }
}
exports.AutocompleteBase = AutocompleteBase;
//# sourceMappingURL=base.js.map