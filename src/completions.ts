/*
 * Copyright (c) 2022, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { StateAggregator } from '@salesforce/core';
import { Org } from '@salesforce/core';
// eslint-disable-next-line sf-plugin/no-oclif-flags-command-import
import { Command } from '@oclif/core';

export type Completion = {
  skipCache?: boolean;
  cacheDuration?: number;
  cacheKey?(ctx: Command.Class): Promise<string>;
  options(ctx: Command.Class): Promise<string[]>;
};

const oneDay = 60 * 60 * 24;

export class CompletionLookup {
  public constructor(private readonly name: string) {}

  public run(): Completion | undefined {
    return CompletionMapping[this.name];
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
    const info = await StateAggregator.create();
    const aliases = info.aliases.getAll();
    const activeAliasOrUsername = [];
    for await (const aliasOrUsername of [...Object.keys(aliases), ...new Set(Object.values(aliases))]) {
      try {
        await (await Org.create({ aliasOrUsername })).refreshAuth();
        activeAliasOrUsername.push(aliasOrUsername);
      } catch (error) {
        /* empty */
      }
    }
    return activeAliasOrUsername;
  },
};

export const CompletionMapping: { [key: string]: Completion } = {
  targetusername: targetUserNameCompletion,
  'target-org': targetUserNameCompletion,
  'target-hub-org': targetUserNameCompletion,
  instanceurl: instanceurlCompletion,
};
