import { expect, test } from '@oclif/test';

// tslint:disable-next-line: no-var-requires
const { default: runtest } = require('../../helpers/runtest');

runtest('autocmplt:script', () => {
  test
    .stdout()
    .command(['autocmplt:script', 'bash'])
    .it('outputs bash profile config', ctx => {
      expect(ctx.stdout).to.contain(`
# sfdx autocomplete setup
SFDX_AC_BASH_SETUP_PATH=${ctx.config.cacheDir}/autocomplete/bash_setup && test -f $SFDX_AC_BASH_SETUP_PATH && source $SFDX_AC_BASH_SETUP_PATH;
`);
    });

  test
    .stdout()
    .command(['autocmplt:script', 'zsh'])
    .it('outputs zsh profile config', ctx => {
      expect(ctx.stdout).to.contain(`
# sfdx autocomplete setup
SFDX_AC_ZSH_SETUP_PATH=${ctx.config.cacheDir}/autocomplete/zsh_setup && test -f $SFDX_AC_ZSH_SETUP_PATH && source $SFDX_AC_ZSH_SETUP_PATH;
`);
    });

  test
    .stdout()
    .command(['autocmplt:script', 'fish'])
    .it('outputs fish profile config', ctx => {
      expect(ctx.stdout).to.contain(`
# sfdx autocomplete setup
SFDX_AC_FISH_SETUP_PATH=${ctx.config.cacheDir}/autocomplete/fish_setup && test -f $SFDX_AC_FISH_SETUP_PATH && source $SFDX_AC_FISH_SETUP_PATH;
`);
    });
});
