/*
 * Copyright 2026, jayree
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { StateAggregator } from '@salesforce/core';
import { Org } from '@salesforce/core';

export type Completion = {
  skipCache?: boolean;
  cacheDuration?: number;
  cacheKey?(): Promise<string>;
  options(): Promise<string[]>;
};

const oneDay = 60 * 60 * 24;

// eslint-disable-next-line no-underscore-dangle
let _activeAliasOrUsername: string[] = [];
export class CompletionLookup {
  public static readonly targetUserNameCompletion: Completion = {
    cacheDuration: oneDay,
    options: async (): Promise<string[]> => {
      if (_activeAliasOrUsername.length) return _activeAliasOrUsername;
      const info = await StateAggregator.create();
      const aliases = info.aliases.getAll();
      const activeAliasOrUsername: string[] = [];
      for await (const aliasOrUsername of [...Object.keys(aliases), ...new Set(Object.values(aliases))]) {
        try {
          await (await Org.create({ aliasOrUsername })).refreshAuth();
          activeAliasOrUsername.push(aliasOrUsername as string);
        } catch (error) {
          /* empty */
        }
      }
      _activeAliasOrUsername = activeAliasOrUsername;

      return activeAliasOrUsername;
    },
  };

  public static readonly instanceurlCompletion: Completion = {
    skipCache: true,

    // eslint-disable-next-line @typescript-eslint/require-await
    options: async () => ['https\\://test.salesforce.com', 'https\\://login.salesforce.com'],
  };

  public static readonly instanceurlCompletionColon: Completion = {
    skipCache: true,

    // eslint-disable-next-line @typescript-eslint/require-await
    options: async () => ['https://test.salesforce.com', 'https://login.salesforce.com'],
  };

  private readonly topicSeparator!: string;

  // eslint-disable-next-line @typescript-eslint/member-ordering
  public readonly CompletionMapping: { [key: string]: Completion } = {
    targetusername: CompletionLookup.targetUserNameCompletion,
    'target-org': CompletionLookup.targetUserNameCompletion,
    targetdevhubusername: CompletionLookup.targetUserNameCompletion,
    'target-hub-org': CompletionLookup.targetUserNameCompletion,
    instanceurl:
      this.topicSeparator === ' '
        ? CompletionLookup.instanceurlCompletion
        : CompletionLookup.instanceurlCompletionColon,
    'instance-url':
      this.topicSeparator === ' '
        ? CompletionLookup.instanceurlCompletion
        : CompletionLookup.instanceurlCompletionColon,
  };

  public constructor(
    private readonly name?: string,
    topicSeparator = ' ',
  ) {
    this.topicSeparator = topicSeparator;
  }

  public run(): Completion | undefined {
    return this.CompletionMapping[this.name as string];
  }
}
