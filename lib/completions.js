/*
 * Copyright (c) 2022, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { StateAggregator } from '@salesforce/core';
import { Org } from '@salesforce/core';
const oneDay = 60 * 60 * 24;
export class CompletionLookup {
    constructor(cmdId, name, description) {
        this.cmdId = cmdId;
        this.name = name;
        this.description = description;
        this.blocklistMap = {
        // app: ['apps:create'],
        // space: ['spaces:create'],
        };
        this.keyAliasMap = {
            key: {
            // 'config:get': 'config',
            },
        };
        this.commandArgsMap = {
            key: {
            // 'config:set': 'configSet',
            },
        };
    }
    get key() {
        return this.argAlias() || this.keyAlias() || this.descriptionAlias() || this.name;
    }
    run() {
        if (this.blocklisted())
            return;
        return CompletionMapping[this.key];
    }
    argAlias() {
        return this.commandArgsMap[this.name]?.[this.cmdId];
    }
    keyAlias() {
        return this.keyAliasMap[this.name]?.[this.cmdId];
    }
    // eslint-disable-next-line class-methods-use-this
    descriptionAlias() {
        const d = this.description;
        // if (d.match(/^dyno size/)) return 'dynosize';
        // if (d.match(/^process type/)) return 'processtype';
        return d ? undefined : undefined;
    }
    blocklisted() {
        return this.blocklistMap[this.name]?.includes(this.cmdId);
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
        return activeAliasOrUsername;
    },
};
// tslint:disable-next-line: variable-name
export const CompletionMapping = {
    targetusername: targetUserNameCompletion,
    'target-org': targetUserNameCompletion,
    instanceurl: instanceurlCompletion,
};
//# sourceMappingURL=completions.js.map