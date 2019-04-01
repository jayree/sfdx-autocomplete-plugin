import { flags } from '@oclif/command';
import { core } from '@salesforce/command';
// import * as Config from '@oclif/config';
// import flatten = require('lodash.flatten');
import { Aliases, AuthInfo } from '@salesforce/core';
import * as _ from 'lodash';

export const oneDay = 60 * 60 * 24;

export class CompletionLookup {
  private get key(): string {
    return this.argAlias() || this.keyAlias() || this.descriptionAlias() || this.name;
  }

  private readonly blacklistMap: { [key: string]: string[] } = {
    app: ['apps:create'],
    space: ['spaces:create']
  };

  private readonly keyAliasMap: { [key: string]: { [key: string]: string } } = {
    key: {
      'config:get': 'config'
    }
  };

  private readonly commandArgsMap: {
    [key: string]: { [key: string]: string };
  } = {
    key: {
      'config:set': 'configSet'
    }
  };

  constructor(private readonly cmdId: string, private readonly name: string, private readonly description?: string) {}

  public run(): flags.ICompletion | undefined {
    if (this.blacklisted()) return;
    return CompletionMapping[this.key];
  }

  private argAlias(): string | undefined {
    return this.commandArgsMap[this.name] && this.commandArgsMap[this.name][this.cmdId];
  }

  private keyAlias(): string | undefined {
    return this.keyAliasMap[this.name] && this.keyAliasMap[this.name][this.cmdId];
  }

  private descriptionAlias(): string | undefined {
    const d = this.description!;
    if (d.match(/^dyno size/)) return 'dynosize';
    if (d.match(/^process type/)) return 'processtype';
  }

  private blacklisted(): boolean {
    return this.blacklistMap[this.name] && this.blacklistMap[this.name].includes(this.cmdId);
  }
}

export const loglevelCompletion: flags.ICompletion = {
  skipCache: true,

  options: async () => {
    return ['trace', 'debug', 'info', 'warn', 'error', 'fatal'];
  }
};

export const resultformatCompletion: flags.ICompletion = {
  skipCache: true,

  options: async () => {
    return ['human', 'csv', 'json'];
  }
};

export const instanceurlCompletion: flags.ICompletion = {
  skipCache: true,

  options: async () => {
    return ['https://test.salesforce.com', 'https://login.salesforce.com'];
  }
};

export const targetUserNameCompletion: flags.ICompletion = {
  cacheDuration: oneDay,
  options: async ctx => {
    try {
      const authFiles = await AuthInfo.listAllAuthFiles();
      const orgs = authFiles.map(authfile => authfile.replace('.json', ''));
      const aliasesOrUsernames = [];
      const aliases = await Aliases.create({});
      for (const org of orgs) {
        const aliasKeys = aliases.getKeysByValue(org);
        const value = _.get(aliasKeys, 0) || org;
        aliasesOrUsernames.push(value);
      }

      const aliasesOrUsernamesToDelete = [];
      await Promise.all(
        aliasesOrUsernames.map(async a => {
          try {
            const org = await core.Org.create({
              aliasOrUsername: a
            });
            await org.refreshAuth();
          } catch (error /* istanbul ignore next */) {
            aliasesOrUsernamesToDelete.push(a);
          }
        })
      );
      return aliasesOrUsernames.filter(alias => !aliasesOrUsernamesToDelete.includes(alias));
    } catch (error) {
      return [];
    }
  }
};

// tslint:disable-next-line: variable-name
export const CompletionMapping: { [key: string]: flags.ICompletion } = {
  targetusername: targetUserNameCompletion,
  loglevel: loglevelCompletion,
  instanceurl: instanceurlCompletion,
  resultformat: resultformatCompletion
};
