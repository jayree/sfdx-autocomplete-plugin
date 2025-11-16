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
