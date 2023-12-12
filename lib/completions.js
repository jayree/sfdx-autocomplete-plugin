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
let _activeAliasOrUsername = [];
export class CompletionLookup {
    name;
    static targetUserNameCompletion = {
        cacheDuration: oneDay,
        options: async () => {
            if (_activeAliasOrUsername.length)
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
    static instanceurlCompletion = {
        skipCache: true,
        // eslint-disable-next-line @typescript-eslint/require-await
        options: async () => ['https\\://test.salesforce.com', 'https\\://login.salesforce.com'],
    };
    static instanceurlCompletionColon = {
        skipCache: true,
        // eslint-disable-next-line @typescript-eslint/require-await
        options: async () => ['https://test.salesforce.com', 'https://login.salesforce.com'],
    };
    topicSeparator;
    // eslint-disable-next-line @typescript-eslint/member-ordering
    CompletionMapping = {
        targetusername: CompletionLookup.targetUserNameCompletion,
        'target-org': CompletionLookup.targetUserNameCompletion,
        targetdevhubusername: CompletionLookup.targetUserNameCompletion,
        'target-hub-org': CompletionLookup.targetUserNameCompletion,
        instanceurl: this.topicSeparator === ' '
            ? CompletionLookup.instanceurlCompletion
            : CompletionLookup.instanceurlCompletionColon,
        'instance-url': this.topicSeparator === ' '
            ? CompletionLookup.instanceurlCompletion
            : CompletionLookup.instanceurlCompletionColon,
    };
    constructor(name, topicSeparator = ' ') {
        this.name = name;
        this.topicSeparator = topicSeparator;
    }
    run() {
        return this.CompletionMapping[this.name];
    }
}
//# sourceMappingURL=completions.js.map