import { Config } from '@oclif/config';
import { expect, test } from '@salesforce/command/lib/test';
import * as path from 'path';

import Create from '../../../src/commands/autocomplete/create';

const root = path.resolve(__dirname, '../../../package.json');
const config = new Config({ root });

const AC_PLUGIN_PATH = path.resolve(__dirname, '..', '..', '..', '..');

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

  it('#genCompletionDotsFunc', () => {
    expect(cmd.completionDotsFunc).to.eq(`expand-or-complete-with-dots() {
  echo -n "..."
  zle expand-or-complete
  zle redisplay
}
zle -N expand-or-complete-with-dots
bindkey "^I" expand-or-complete-with-dots`);
  });

  it('#bashSetupScript', () => {
    const shellSetup = cmd.bashSetupScript;
    expect(shellSetup).to.eq(`SFDX_AC_ANALYTICS_DIR=${global.config.cacheDir}/autocomplete/completion_analytics;
SFDX_AC_COMMANDS_PATH=${global.config.cacheDir}/autocomplete/commands;
SFDX_AC_BASH_COMPFUNC_PATH=${AC_PLUGIN_PATH}/autocomplete/bash/sfdx.bash && test -f $SFDX_AC_BASH_COMPFUNC_PATH && source $SFDX_AC_BASH_COMPFUNC_PATH;
`);
  });

  it('#zshSetupScript', () => {
    const shellSetup = cmd.zshSetupScript;
    expect(shellSetup).to.eq(`expand-or-complete-with-dots() {
  echo -n "..."
  zle expand-or-complete
  zle redisplay
}
zle -N expand-or-complete-with-dots
bindkey "^I" expand-or-complete-with-dots
SFDX_AC_ANALYTICS_DIR=${global.config.cacheDir}/autocomplete/completion_analytics;
SFDX_AC_COMMANDS_PATH=${global.config.cacheDir}/autocomplete/commands;
SFDX_AC_ZSH_SETTERS_PATH=\${SFDX_AC_COMMANDS_PATH}_setters && test -f $SFDX_AC_ZSH_SETTERS_PATH && source $SFDX_AC_ZSH_SETTERS_PATH;
fpath=(
${AC_PLUGIN_PATH}/autocomplete/zsh
$fpath
);
autoload -Uz compinit;
compinit;
`);
  });

  it('#zshSetupScript (w/o ellipsis)', () => {
    const oldEnv = process.env;
    process.env.SFDX_AC_ZSH_SKIP_ELLIPSIS = '1';
    const shellSetup = cmd.zshSetupScript;

    expect(shellSetup).to.eq(`
SFDX_AC_ANALYTICS_DIR=${global.config.cacheDir}/autocomplete/completion_analytics;
SFDX_AC_COMMANDS_PATH=${global.config.cacheDir}/autocomplete/commands;
SFDX_AC_ZSH_SETTERS_PATH=\${SFDX_AC_COMMANDS_PATH}_setters && test -f $SFDX_AC_ZSH_SETTERS_PATH && source $SFDX_AC_ZSH_SETTERS_PATH;
fpath=(
${AC_PLUGIN_PATH}/autocomplete/zsh
$fpath
);
autoload -Uz compinit;
compinit;
`);
    process.env = oldEnv;
  });
});
