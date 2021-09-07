"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompletionMapping = exports.targetUserNameCompletion = exports.instanceurlCompletion = exports.CompletionLookup = exports.oneDay = void 0;
// import * as Config from '@oclif/config';
// import flatten = require('lodash.flatten');
const core_1 = require("@salesforce/core");
const lodash_1 = require("lodash");
exports.oneDay = 60 * 60 * 24;
class CompletionLookup {
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    constructor(cmdId, name, description) {
        this.cmdId = cmdId;
        this.name = name;
        this.description = description;
        this.blacklistMap = {
        // app: ['apps:create'],
        // space: ['spaces:create']
        };
        this.keyAliasMap = {
        /*     resultformat: {
          'force:apex:test:report': 'resultformatTap',
          'force:apex:test:run': 'resultformatTap',
          'force:lightning:test:run': 'resultformatTap',
          'force:data:soql:query': 'resultformatCsv'
        } */
        };
        this.commandArgsMap = {};
    }
    get key() {
        return this.argAlias() || this.keyAlias() || this.descriptionAlias() || this.name;
    }
    run() {
        if (this.blacklisted())
            return;
        return exports.CompletionMapping[this.key];
    }
    argAlias() {
        return this.commandArgsMap[this.name] && this.commandArgsMap[this.name][this.cmdId];
    }
    keyAlias() {
        return this.keyAliasMap[this.name] && this.keyAliasMap[this.name][this.cmdId];
    }
    descriptionAlias() {
        const d = this.description;
        // if (d.match(/^dyno size/)) return 'dynosize';
        // if (d.match(/^process type/)) return 'processtype';
        if (d)
            return '';
        return '';
    }
    blacklisted() {
        return this.blacklistMap[this.name] && this.blacklistMap[this.name].includes(this.cmdId);
    }
}
exports.CompletionLookup = CompletionLookup;
exports.instanceurlCompletion = {
    skipCache: true,
    // eslint-disable-next-line @typescript-eslint/require-await
    options: async () => {
        return ['https://test.salesforce.com', 'https://login.salesforce.com'];
    },
};
exports.targetUserNameCompletion = {
    cacheDuration: exports.oneDay,
    options: async () => {
        try {
            const authFiles = await core_1.AuthInfo.listAllAuthFiles();
            const orgs = authFiles.map((authfile) => authfile.replace('.json', ''));
            const aliasesOrUsernames = [];
            const aliases = await core_1.Aliases.create({});
            for (const org of orgs) {
                const aliasKeys = aliases.getKeysByValue(org);
                const value = (0, lodash_1.get)(aliasKeys, 0) || org;
                aliasesOrUsernames.push(value);
            }
            const aliasesOrUsernamesToDelete = [];
            await Promise.all(aliasesOrUsernames.map(async (a) => {
                try {
                    const org = await core_1.Org.create({
                        aliasOrUsername: a,
                    });
                    await org.refreshAuth();
                }
                catch (error /* istanbul ignore next */) {
                    aliasesOrUsernamesToDelete.push(a);
                }
            }));
            return aliasesOrUsernames.filter((alias) => !aliasesOrUsernamesToDelete.includes(alias));
        }
        catch (error) {
            return [];
        }
    },
};
// tslint:disable-next-line: variable-name
exports.CompletionMapping = {
    targetusername: exports.targetUserNameCompletion,
    instanceurl: exports.instanceurlCompletion,
};
//# sourceMappingURL=completions.js.map