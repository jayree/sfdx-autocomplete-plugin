'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
const test_1 = require('@oclif/test');
// tslint:disable-next-line: no-var-requires
const { default: runtest } = require('../../helpers/runtest');
runtest('autocomplete:script', () => {
  test_1.test
    .stdout()
    .command(['autocomplete:script', 'bash'])
    .it('outputs bash profile config', ctx => {
      test_1.expect(ctx.stdout).to.contain(`
# sfdx autocomplete setup
SFDX_AC_BASH_SETUP_PATH=${
        ctx.config.cacheDir
      }/autocomplete/bash_setup && test -f $SFDX_AC_BASH_SETUP_PATH && source $SFDX_AC_BASH_SETUP_PATH;
`);
    });
  test_1.test
    .stdout()
    .command(['autocomplete:script', 'zsh'])
    .it('outputs zsh profile config', ctx => {
      test_1.expect(ctx.stdout).to.contain(`
# sfdx autocomplete setup
SFDX_AC_ZSH_SETUP_PATH=${
        ctx.config.cacheDir
      }/autocomplete/zsh_setup && test -f $SFDX_AC_ZSH_SETUP_PATH && source $SFDX_AC_ZSH_SETUP_PATH;
`);
    });
  test_1.test
    .stderr()
    .command(['autocomplete:script', 'fish'])
    .it('errors on unsupported shell', ctx => {
      test_1.expect(ctx.stderr).to.contain('fish is not a supported shell for autocomplete');
    });
});
//# sourceMappingURL=script.test.js.map
