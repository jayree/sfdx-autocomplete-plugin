/*
 * Copyright (c) 2022, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { Config } from '@oclif/core';
import { expect } from 'chai';
import { runCommand } from '@oclif/test';

describe('autocmplt:script', () => {
  it('outputs bash profile config', async () => {
    const config = await Config.load(import.meta.url);
    const { stdout } = await runCommand<{ name: string }>(['autocmplt:script', 'bash']);
    expect(stdout).to.contain(`
# sfdx autocomplete setup
SFDX_AC_BASH_SETUP_PATH=${config.cacheDir}/autocomplete/bash_setup && test -f $SFDX_AC_BASH_SETUP_PATH && source $SFDX_AC_BASH_SETUP_PATH;
`);
  });

  it('outputs zsh profile config', async () => {
    const config = await Config.load(import.meta.url);
    const { stdout } = await runCommand<{ name: string }>(['autocmplt:script', 'zsh']);
    expect(stdout).to.contain(`
# sfdx autocomplete setup
SFDX_AC_ZSH_SETUP_PATH=${config.cacheDir}/autocomplete/zsh_setup && test -f $SFDX_AC_ZSH_SETUP_PATH && source $SFDX_AC_ZSH_SETUP_PATH;
`);
  });

  it('outputs fish profile config', async () => {
    const config = await Config.load(import.meta.url);
    const { stdout } = await runCommand<{ name: string }>(['autocmplt:script', 'fish']);
    expect(stdout).to.contain(`
# sfdx autocomplete setup
SFDX_AC_FISH_SETUP_PATH=${config.cacheDir}/autocomplete/fish_setup && test -f $SFDX_AC_FISH_SETUP_PATH && source $SFDX_AC_FISH_SETUP_PATH;
`);
  });
});
