import { Config } from '@oclif/config';
import { expect, test } from '@salesforce/command/lib/test';
import * as path from 'path';

const root = path.resolve(__dirname, '../../../package.json');
const config = new Config({ root });

// autocomplete will throw error on windows ci
const skipwindows = process.platform === 'win32' ? describe.skip : describe;

skipwindows('autocomplete:script', () => {
  before(async () => {
    if (process.platform === 'win32') this.skip();
    await config.load();
    global.config = new Config(config);
    global.config.cacheDir = path.join(__dirname, '../../../../test/assets/cache');
    global.config.bin = 'sfdx';
  });

  test
    .stdout()
    .command(['autocomplete:script'])
    .it('outputs bash profile config', ctx => {
      expect(ctx.stdout).to.contain(`
# sfdx autocomplete setup
SFDX_AC_BASH_SETUP_PATH=${
        global.config.cacheDir
      }/autocomplete/bash_setup && test -f $SFDX_AC_BASH_SETUP_PATH && source $SFDX_AC_BASH_SETUP_PATH;
`);
    });

  test
    .stdout()
    .command(['autocomplete:script', 'bash'])
    .it('outputs bash profile config', ctx => {
      expect(ctx.stdout).to.contain(`
# sfdx autocomplete setup
SFDX_AC_BASH_SETUP_PATH=${
        global.config.cacheDir
      }/autocomplete/bash_setup && test -f $SFDX_AC_BASH_SETUP_PATH && source $SFDX_AC_BASH_SETUP_PATH;
`);
    });

  test
    .stdout()
    .command(['autocomplete:script', 'zsh'])
    .it('outputs zsh profile config', ctx => {
      expect(ctx.stdout).to.contain(`
# sfdx autocomplete setup
SFDX_AC_ZSH_SETUP_PATH=${
        global.config.cacheDir
      }/autocomplete/zsh_setup && test -f $SFDX_AC_ZSH_SETUP_PATH && source $SFDX_AC_ZSH_SETUP_PATH;
`);
    });

  test
    .stderr()
    .command(['autocomplete:script', 'fish'])
    .it('errors on unsupported shell', ctx => {
      expect(ctx.stderr).to.contain('fish is not a supported shell for autocomplete');
    });
});
