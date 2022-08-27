import { StateAggregator } from '@salesforce/core';
export const oneDay = 60 * 60 * 24;
export class CompletionLookup {
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
        return CompletionMapping[this.key];
    }
    argAlias() {
        return this.commandArgsMap[this.name]?.[this.cmdId];
    }
    keyAlias() {
        return this.keyAliasMap[this.name]?.[this.cmdId];
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
        return this.blacklistMap[this.name]?.includes(this.cmdId);
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
        try {
            const info = await StateAggregator.create();
            const aliases = info.aliases.getAll();
            return [...Object.keys(aliases), ...new Set(Object.values(aliases))];
        }
        catch (error) {
            return [];
        }
    },
};
// tslint:disable-next-line: variable-name
export const CompletionMapping = {
    targetusername: targetUserNameCompletion,
    'target-org': targetUserNameCompletion,
    instanceurl: instanceurlCompletion,
};
//# sourceMappingURL=completions.js.map