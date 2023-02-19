/*
 * Copyright (c) 2022, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { StateAggregator } from '@salesforce/core';
import { Org } from '@salesforce/core';
const oneDay = 60 * 60 * 24;
// eslint-disable-next-line no-underscore-dangle
let _activeAliasOrUsername;
export class CompletionLookup {
    constructor(name) {
        this.name = name;
    }
    run() {
        return CompletionMapping[this.name];
    }
}
export const instanceurlCompletion = {
    skipCache: true,
    // eslint-disable-next-line @typescript-eslint/require-await
    options: async () => ['https://test.salesforce.com', 'https://login.salesforce.com'],
};
export const targetUserNameCompletion = {
    cacheDuration: oneDay,
    options: async () => {
        if (_activeAliasOrUsername)
            return _activeAliasOrUsername;
        const info = await StateAggregator.create();
        const aliases = info.aliases.getAll();
        const activeAliasOrUsername = [];
        for await (const aliasOrUsername of [...Object.keys(aliases), ...new Set(Object.values(aliases))]) {
            try {
                await (await Org.create({ aliasOrUsername })).refreshAuth();
                activeAliasOrUsername.push(aliasOrUsername);
            }
            catch (error) {
                /* empty */
            }
        }
        _activeAliasOrUsername = activeAliasOrUsername;
        return activeAliasOrUsername;
    },
};
export const CompletionMapping = {
    targetusername: targetUserNameCompletion,
    'target-org': targetUserNameCompletion,
    targetdevhubusername: targetUserNameCompletion,
    'target-hub-org': targetUserNameCompletion,
    instanceurl: instanceurlCompletion,
    'instance-url': instanceurlCompletion,
};
//# sourceMappingURL=completions.js.map