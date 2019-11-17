import { Config, Plugin } from '@oclif/config';
import { loadJSON } from '@oclif/config/lib/util';
import { expect } from 'chai';
import * as path from 'path';

import Create from '../../../src/commands/autocomplete/create';

const root = path.resolve(__dirname, '../../../../package.json');
const config = new Config({ root });

// autocomplete will throw error on windows
// tslint:disable-next-line: no-var-requires
const { default: runtest } = require('../../helpers/runtest');

const AC_PLUGIN_PATH = path.resolve(__dirname, '..', '..', '..', '..');

const cacheBuildFlagsTest = {
  id: 'autocomplete:create',
  flags: {
    targetusername: {
      name: 'targetusername',
      type: 'option',
      description: 'targetusername to use'
    },
    visable: { name: 'visable', type: 'boolean', description: 'visable flag' },
    hidden: {
      name: 'hidden',
      type: 'boolean',
      description: 'hidden flag',
      hidden: true
    }
  },
  args: []
};

runtest('Create', () => {
  // Unit test private methods for extra coverage
  describe('private methods', () => {
    // tslint:disable-next-line: no-any
    let cmd: any;
    // tslint:disable-next-line: no-any
    let klass: any;
    // tslint:disable-next-line: no-any
    let plugin: any;
    before(async () => {
      await config.load();
      cmd = new Create([], config);
      plugin = new Plugin({ root });
      cmd.config.plugins = [plugin];
      await plugin.load();
      plugin.manifest = await loadJSON(path.resolve(__dirname, '../../../../test/test.oclif.manifest.json'));
      plugin.commands = Object.entries(plugin.manifest.commands).map(([id, c]) => ({
        ...(c as object),
        load: () => plugin.findCommand(id, { must: true })
      }));
      klass = plugin.commands[1];
    });

    it('file paths', () => {
      const dir = cmd.config.cacheDir;
      expect(cmd.bashSetupScriptPath).to.eq(`${dir}/autocomplete/bash_setup`);
      expect(cmd.zshSetupScriptPath).to.eq(`${dir}/autocomplete/zsh_setup`);
      expect(cmd.bashCommandsListPath).to.eq(`${dir}/autocomplete/commands`);
      expect(cmd.zshCompletionSettersPath).to.eq(`${dir}/autocomplete/commands_setters`);
    });

    it('#genCmdWithDescription', () => {
      expect(cmd.genCmdWithDescription(klass)).to.eq('"autocomplete\\:foo":"foo cmd for autocomplete testing"');
    });

    it('#genCmdPublicFlags', () => {
      expect(cmd.genCmdPublicFlags(cacheBuildFlagsTest)).to.eq('--targetusername --visable');
      expect(cmd.genCmdPublicFlags(cacheBuildFlagsTest)).to.not.match(/--hidden/);
      expect(cmd.genCmdPublicFlags(Create)).to.eq('--json --loglevel');
    });

    it('#bashCommandsList', () => {
      expect(cmd.bashCommandsList).to.eq(
        'autocomplete --skip-instructions\nautocomplete:foo --targetusername --bar --json'
      );
    });

    it('#zshCompletionSetters', () => {
      expect(cmd.zshCompletionSetters).to.eq(`
_sfdx_set_all_commands_list () {
_sfdx_all_commands_list=(
"autocomplete":"display autocomplete instructions"
"autocomplete\\:foo":"foo cmd for autocomplete testing"
)
}

_sfdx_set_autocomplete_flags () {
_sfdx_flags=(
"--skip-instructions[(switch) Do not show installation instructions]"
)
}

_sfdx_set_autocomplete_foo_flags () {
_sfdx_flags=(
"--targetusername=-[(autocomplete) targetusername to use]: :_sfdx_compadd_flag_options"
"--bar=-[bar for testing]"
"--json[(switch) output in json format]"
)
}
`);
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
      expect(shellSetup).to.eq(`SFDX_AC_ANALYTICS_DIR=${cmd.config.cacheDir}/autocomplete/completion_analytics;
SFDX_AC_COMMANDS_PATH=${cmd.config.cacheDir}/autocomplete/commands;
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
SFDX_AC_ANALYTICS_DIR=${cmd.config.cacheDir}/autocomplete/completion_analytics;
SFDX_AC_COMMANDS_PATH=${cmd.config.cacheDir}/autocomplete/commands;
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
SFDX_AC_ANALYTICS_DIR=${cmd.config.cacheDir}/autocomplete/completion_analytics;
SFDX_AC_COMMANDS_PATH=${cmd.config.cacheDir}/autocomplete/commands;
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

    it('#genZshAllCmdsListSetter', () => {
      const cmdsWithDesc = ['"foo\\:alpha":"foo:alpha description"', '"foo\\:beta":"foo:beta description"'];
      expect(cmd.genZshAllCmdsListSetter(cmdsWithDesc)).to.eq(`
_sfdx_set_all_commands_list () {
_sfdx_all_commands_list=(
"foo\\:alpha":"foo:alpha description"
"foo\\:beta":"foo:beta description"
)
}
`);
    });

    it('#genZshCmdFlagsSetter', () => {
      expect(cmd.genZshCmdFlagsSetter(cacheBuildFlagsTest)).to.eq(`_sfdx_set_autocomplete_create_flags () {
_sfdx_flags=(
"--targetusername=-[(autocomplete) targetusername to use]: :_sfdx_compadd_flag_options"
"--visable[(switch) visable flag]"
)
}
`);
    });
  });
});
