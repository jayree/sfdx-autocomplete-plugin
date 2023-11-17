/*
 * Copyright (c) 2022, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { createRequire } from 'node:module';
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const { expect, test } = createRequire(import.meta.url)('@oclif/test');

describe('autocmplt:script', () => {
  test
    .stdout()
    .command(['autocmplt:script', 'bash'])
    .it('outputs bash profile config', (ctx: { stdout: string; config: { cacheDir: string } }) => {
      expect(ctx.stdout).to.contain(`
# sfdx autocomplete setup
SFDX_AC_BASH_SETUP_PATH=${ctx.config.cacheDir}/autocomplete/bash_setup && test -f $SFDX_AC_BASH_SETUP_PATH && source $SFDX_AC_BASH_SETUP_PATH;
`);
    });

  test
    .stdout()
    .command(['autocmplt:script', 'zsh'])
    .it('outputs zsh profile config', (ctx: { stdout: string; config: { cacheDir: string } }) => {
      expect(ctx.stdout).to.contain(`
# sfdx autocomplete setup
SFDX_AC_ZSH_SETUP_PATH=${ctx.config.cacheDir}/autocomplete/zsh_setup && test -f $SFDX_AC_ZSH_SETUP_PATH && source $SFDX_AC_ZSH_SETUP_PATH;
`);
    });

  test
    .stdout()
    .command(['autocmplt:script', 'fish'])
    .it('outputs fish profile config', (ctx: { stdout: string; config: { cacheDir: string } }) => {
      expect(ctx.stdout).to.contain(`
# sfdx autocomplete setup
SFDX_AC_FISH_SETUP_PATH=${ctx.config.cacheDir}/autocomplete/fish_setup && test -f $SFDX_AC_FISH_SETUP_PATH && source $SFDX_AC_FISH_SETUP_PATH;
`);
    });
});
