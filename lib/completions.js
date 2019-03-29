"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// import * as Config from '@oclif/config';
// import flatten = require('lodash.flatten');
const command_1 = require("@salesforce/command");
const fs = require("fs-extra");
const path = require("path");
exports.oneDay = 60 * 60 * 24;
class CompletionLookup {
    constructor(cmdId, name, description) {
        this.cmdId = cmdId;
        this.name = name;
        this.description = description;
        this.blacklistMap = {
            app: ['apps:create'],
            space: ['spaces:create']
        };
        this.keyAliasMap = {
            key: {
                'config:get': 'config'
            }
        };
        this.commandArgsMap = {
            key: {
                'config:set': 'configSet'
            }
        };
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
        if (d.match(/^dyno size/))
            return 'dynosize';
        if (d.match(/^process type/))
            return 'processtype';
    }
    blacklisted() {
        return this.blacklistMap[this.name] && this.blacklistMap[this.name].includes(this.cmdId);
    }
}
exports.CompletionLookup = CompletionLookup;
exports.loglevelCompletion = {
    skipCache: true,
    options: async () => {
        return ['trace', 'debug', 'info', 'warn', 'error', 'fatal'];
    }
};
exports.resultformatCompletion = {
    skipCache: true,
    options: async () => {
        return ['human', 'csv', 'json'];
    }
};
exports.instanceurlCompletion = {
    skipCache: true,
    options: async () => {
        return ['https://test.salesforce.com', 'https://login.salesforce.com'];
    }
};
exports.targetUserNameCompletion = {
    cacheDuration: exports.oneDay,
    options: async (ctx) => {
        try {
            const aliases = Object.keys((await fs.readJSON(path.join(ctx.config.home, command_1.core.Global.STATE_FOLDER, command_1.core.Aliases.getFileName())))[command_1.core.AliasGroup.ORGS]);
            const aliasesToDelete = [];
            await Promise.all(aliases.map(async (a) => {
                try {
                    const org = await command_1.core.Org.create({
                        aliasOrUsername: a
                    });
                    await org.refreshAuth();
                }
                catch (error /* istanbul ignore next */) {
                    aliasesToDelete.push(a);
                }
            }));
            return aliases.filter(alias => !aliasesToDelete.includes(alias));
        }
        catch (error) {
            // return [];
            throw error;
        }
    }
};
// tslint:disable-next-line: variable-name
exports.CompletionMapping = {
    targetusername: exports.targetUserNameCompletion,
    loglevel: exports.loglevelCompletion,
    instanceurl: exports.instanceurlCompletion,
    resultformat: exports.resultformatCompletion
};
//# sourceMappingURL=completions.js.map