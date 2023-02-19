/*
 * Copyright (c) 2022, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { createRequire } from 'module';
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const { expect, test } = createRequire(import.meta.url)('@oclif/test');

describe('autocmplt:index', () => {
  test
    .stdout()
    .command(['autocmplt', 'bash'])
    .it('provides bash instructions', (ctx) => {
      expect(ctx.stdout).to.contain(`
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

  test
    .stdout()
    .command(['autocmplt', 'zsh'])
    .it('provides zsh instructions', (ctx) => {
      expect(ctx.stdout).to.contain(`
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

  test
    .stdout()
    .command(['autocmplt', 'fish'])
    .it('provides fish instructions', (ctx) => {
      expect(ctx.stdout).to.contain(`
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
