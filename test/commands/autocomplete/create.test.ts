import { Config } from '@oclif/config';
import { expect, test } from '@salesforce/command/lib/test';
import * as path from 'path';

import Create from '../../../src/commands/autocomplete/create';

const root = path.resolve(__dirname, '../../../package.json');
const config = new Config({ root });

// autocomplete will throw error on windows ci
const skipwindows = process.platform === 'win32' ? describe.skip : describe;

skipwindows('autocompleteCreate', () => {
  // tslint:disable-next-line: no-any
  let cmd: any;
  before(async () => {
    if (process.platform === 'win32') this.skip();
    await config.load();
    global.config = new Config(config);
    global.config.cacheDir = path.join(__dirname, '../../../../test/assets/cache');
    global.config.bin = 'sfdx';
    cmd = new Create([], config);
    // tslint:disable-next-line: no-any
    cmd['logger'] = { error: () => {}, info: () => {}, warn: () => {} } as any;
    await cmd.run();
  });

  test.it('file paths', () => {
    const dir = global.config.cacheDir;
    expect(cmd.bashSetupScriptPath).to.eq(`${dir}/autocomplete/bash_setup`);
    expect(cmd.zshSetupScriptPath).to.eq(`${dir}/autocomplete/zsh_setup`);
    expect(cmd.bashCommandsListPath).to.eq(`${dir}/autocomplete/commands`);
    expect(cmd.zshCompletionSettersPath).to.eq(`${dir}/autocomplete/commands_setters`);
  });

  test.it('#bashSetupScript', () => {
    expect(cmd.bashSetupScript).to.eq(
      `SFDX_AC_BASH_COMPFUNC_PATH=${
        global.config.cacheDir
      }/autocomplete/functions/bash/sfdx.bash && test -f $SFDX_AC_BASH_COMPFUNC_PATH && source $SFDX_AC_BASH_COMPFUNC_PATH;\n`
    );
  });

  test.it('#zshSetupScript', () => {
    expect(cmd.zshSetupScript).to.eq(`
fpath=(
${global.config.cacheDir}/autocomplete/functions/zsh
$fpath
);
autoload -Uz compinit;
compinit;
`);
  });
});
