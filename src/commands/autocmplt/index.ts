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
import path from 'node:path';
import { Flags } from '@salesforce/sf-plugins-core';
import { Args } from '@oclif/core';
import chalk from 'chalk';
import { Completion, CompletionLookup } from '../../completions.js';

import { AutocompleteBase } from '../../base.js';
import { updateCache } from '../../cache.js';

import Create from './create.js';

export default class Index extends AutocompleteBase {
  public static readonly description = 'display autocomplete installation instructions';

  public static args = {
    shell: Args.string({ description: 'shell type', required: false }),
  };

  public static flags = {
    ...AutocompleteBase.flags,
    'refresh-cache': Flags.boolean({
      description: 'refresh cache only (ignores displaying instructions)',
      char: 'r',
    }),
  };

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(Index);
    const shell: string = args.shell ?? this.config.shell;
    this.errorIfNotSupportedShell(shell);
    this.spinner.start(`${chalk.bold('Building the autocomplete cache')}`);
    await Create.run([], this.config);
    await this.updateCache(CompletionLookup.targetUserNameCompletion, 'targetusername');
    this.spinner.stop();

    if (!flags['refresh-cache']) {
      const bin = this.config.bin;
      const bashNote =
        'If your terminal starts as a login shell you may need to print the init script into ~/.bash_profile or ~/.profile.';
      const zshNote = `After sourcing, you can run \`${chalk.cyan(
        '$ compaudit -D',
      )}\` to ensure no permissions conflicts are present`;
      const fishNote = 'This assumes your Fish configuration is stored at ~/.config/fish/config.fish';
      const note = shell === 'zsh' ? zshNote : shell === 'bash' ? bashNote : fishNote;
      const tabStr = shell === 'bash' ? '<TAB><TAB>' : '<TAB>';
      const addStr =
        shell === 'fish'
          ? `Update your shell to load the new completions
${chalk.cyan('$ source ~/.config/fish/config.fish')}`
          : `Add the autocomplete env var to your ${shell} profile and source it
${chalk.cyan(
  `$ printf "$(${bin} autocmplt:script ${shell})" >> ~/.${shell}rc; ${
    shell === 'zsh' ? 'exec zsh' : `source ~/.${shell}rc`
  }`,
)}`;

      this.log(`
${chalk.bold(`Setup Instructions for ${bin.toUpperCase()} CLI Autocomplete ---`)}

1) ${addStr}

NOTE: ${note}

2) Test it out, e.g.:
${chalk.cyan(`$ ${bin} ${tabStr}`)}                 # Command completion
${chalk.cyan(`$ ${bin} apps:info --${tabStr}`)}     # Flag completion
${chalk.cyan(`$ ${bin} apps:info --app=${tabStr}`)} # Flag option completion

Enjoy!
`);
    }
  }

  private async updateCache(completion: Completion, cacheKey: string): Promise<void> {
    const cachePath = path.join(this.completionsCacheDir, cacheKey);
    const options = await completion.options();
    await updateCache(cachePath, options);
  }
}
