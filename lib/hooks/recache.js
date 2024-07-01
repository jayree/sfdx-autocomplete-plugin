/*
 * Copyright (c) 2022, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import path from 'node:path';
import { Ux } from '@salesforce/sf-plugins-core';
import fs from 'fs-extra';
import { CompletionLookup } from '../completions.js';
import { updateCache } from '../cache.js';
import acCreate from '../commands/autocmplt/create.js';
export const completions = async function () {
    const ux = new Ux();
    // autocomplete is now in core, skip windows
    if (this.config.windows)
        return;
    const completionsDir = path.join(this.config.cacheDir, 'autocomplete', 'completions');
    const rm = () => fs.emptyDir(completionsDir);
    const rmKey = (cacheKey) => fs.remove(path.join(completionsDir, cacheKey));
    await rmKey('targetusername');
    const update = async (completion, cacheKey) => {
        const cachePath = path.join(completionsDir, cacheKey);
        const options = await completion.options();
        await updateCache(cachePath, options);
    };
    process.once('beforeExit', () => {
        try {
            ux.spinner.start(`${this.config.bin}-autocmplt: Updating completions`);
            void rm();
            void acCreate.run([], this.config);
            void update(CompletionLookup.targetUserNameCompletion, 'targetusername');
        }
        catch (err) {
            this.debug(err.message);
        }
        ux.spinner.stop();
    });
};
//# sourceMappingURL=recache.js.map