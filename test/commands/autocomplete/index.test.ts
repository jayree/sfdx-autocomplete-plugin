/*
 * Copyright 2025, jayree
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

import { expect } from 'chai';
import { runCommand } from '@oclif/test';

describe('autocmplt:index', () => {
  it('provides bash instructions', async () => {
    const { stdout } = await runCommand<{ name: string }>(['autocmplt', 'bash']);
    expect(stdout).to.contain(`
Setup Instructions for SFDX CLI Autocomplete ---

1) Add the autocomplete env var to your bash profile and source it
$ printf "$(sfdx autocmplt:script bash)" >> ~/.bashrc; source ~/.bashrc

NOTE: If your terminal starts as a login shell you may need to print the init script into ~/.bash_profile or ~/.profile.

2) Test it out, e.g.:
$ sfdx <TAB><TAB>                 # Command completion
$ sfdx apps:info --<TAB><TAB>     # Flag completion
$ sfdx apps:info --app=<TAB><TAB> # Flag option completion

Enjoy!

`);
  });

  it('provides zsh instructions', async () => {
    const { stdout } = await runCommand<{ name: string }>(['autocmplt', 'zsh']);
    expect(stdout).to.contain(`
Setup Instructions for SFDX CLI Autocomplete ---

1) Add the autocomplete env var to your zsh profile and source it
$ printf "$(sfdx autocmplt:script zsh)" >> ~/.zshrc; exec zsh

NOTE: After sourcing, you can run \`$ compaudit -D\` to ensure no permissions conflicts are present

2) Test it out, e.g.:
$ sfdx <TAB>                 # Command completion
$ sfdx apps:info --<TAB>     # Flag completion
$ sfdx apps:info --app=<TAB> # Flag option completion

Enjoy!

`);
  });

  it('provides fish instructions', async () => {
    const { stdout } = await runCommand<{ name: string }>(['autocmplt', 'fish']);
    expect(stdout).to.contain(`
Setup Instructions for SFDX CLI Autocomplete ---

1) Update your shell to load the new completions
$ source ~/.config/fish/config.fish

NOTE: This assumes your Fish configuration is stored at ~/.config/fish/config.fish

2) Test it out, e.g.:
$ sfdx <TAB>                 # Command completion
$ sfdx apps:info --<TAB>     # Flag completion
$ sfdx apps:info --app=<TAB> # Flag option completion

Enjoy!

`);
  });
});
