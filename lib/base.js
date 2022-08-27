/*
 * Copyright (c) 2022, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import path from 'path';
import { Command } from '@oclif/core';
import fs from 'fs-extra';
import { fetchCache } from './cache.js';
import { CompletionLookup } from './completions.js';
export class AutocompleteBase extends Command {
    constructor() {
        super(...arguments);
        this.parsedArgs = {};
        this.parsedFlags = {};
    }
    get cliBin() {
        return this.config.bin;
    }
    get cliBinEnvVar() {
        return this.config.bin.toUpperCase().replace('-', '_');
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
        if (cacheCompletion?.options) {
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
            const options = await fetchCache(flagCachePath, duration, skip, opts);
            // return options cache
            return (options || []).join('\n');
        }
    }
    // eslint-disable-next-line class-methods-use-this
    findCompletion(cmdId, name, description = '') {
        return new CompletionLookup(cmdId, name, description).run();
    }
}
//# sourceMappingURL=base.js.map