import { flags } from '@oclif/command';
import { GlobalInfo } from '@salesforce/core';

export const oneDay = 60 * 60 * 24;

export class CompletionLookup {
  private readonly blacklistMap: { [key: string]: string[] } = {
    // app: ['apps:create'],
    // space: ['spaces:create']
  };

  private readonly keyAliasMap: { [key: string]: { [key: string]: string } } = {
    /*     resultformat: {
      'force:apex:test:report': 'resultformatTap',
      'force:apex:test:run': 'resultformatTap',
      'force:lightning:test:run': 'resultformatTap',
      'force:data:soql:query': 'resultformatCsv'
    } */
  };

  private readonly commandArgsMap: {
    [key: string]: { [key: string]: string };
  } = {};

  // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
  constructor(private readonly cmdId: string, private readonly name: string, private readonly description?: string) {}

  private get key(): string {
    return this.argAlias() || this.keyAlias() || this.descriptionAlias() || this.name;
  }

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
    const d = this.description;
    // if (d.match(/^dyno size/)) return 'dynosize';
    // if (d.match(/^process type/)) return 'processtype';
    if (d) return '';
    return '';
  }

  private blacklisted(): boolean {
    return this.blacklistMap[this.name] && this.blacklistMap[this.name].includes(this.cmdId);
  }
}

export const instanceurlCompletion: flags.ICompletion = {
  skipCache: true,

  // eslint-disable-next-line @typescript-eslint/require-await
  options: async () => {
    return ['https://test.salesforce.com', 'https://login.salesforce.com'];
  },
};

export const targetUserNameCompletion: flags.ICompletion = {
  cacheDuration: oneDay,
  options: async () => {
    try {
      const info = await GlobalInfo.create();
      return [...Object.keys(info.aliases.getAll()), ...new Set(Object.values(info.aliases.getAll()))];
    } catch (error) {
      return [];
    }
  },
};

// tslint:disable-next-line: variable-name
export const CompletionMapping: { [key: string]: flags.ICompletion } = {
  targetusername: targetUserNameCompletion,
  instanceurl: instanceurlCompletion,
};
