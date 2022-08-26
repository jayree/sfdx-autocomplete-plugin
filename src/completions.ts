/*
 * Copyright (c) 2022, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { Completion } from '@oclif/core/lib/interfaces/index.js';
import { StateAggregator } from '@salesforce/core';

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

  public run(): Completion | undefined {
    if (this.blacklisted()) return;
    return CompletionMapping[this.key];
  }

  private argAlias(): string | undefined {
    return this.commandArgsMap[this.name]?.[this.cmdId];
  }

  private keyAlias(): string | undefined {
    return this.keyAliasMap[this.name]?.[this.cmdId];
  }

  private descriptionAlias(): string | undefined {
    const d = this.description;
    // if (d.match(/^dyno size/)) return 'dynosize';
    // if (d.match(/^process type/)) return 'processtype';
    if (d) return '';
    return '';
  }

  private blacklisted(): boolean {
    return this.blacklistMap[this.name]?.includes(this.cmdId);
  }
}

export const instanceurlCompletion: Completion = {
  skipCache: true,

  // eslint-disable-next-line @typescript-eslint/require-await
  options: async () => ['https://test.salesforce.com', 'https://login.salesforce.com'],
};

export const targetUserNameCompletion: Completion = {
  cacheDuration: oneDay,
  options: async () => {
    try {
      const info = await StateAggregator.create();
      return [...Object.keys(info.aliases.getAll()), ...new Set(Object.values(info.aliases.getAll()))];
    } catch (error) {
      return [];
    }
  },
};

// tslint:disable-next-line: variable-name
export const CompletionMapping: { [key: string]: Completion } = {
  targetusername: targetUserNameCompletion,
  instanceurl: instanceurlCompletion,
};
