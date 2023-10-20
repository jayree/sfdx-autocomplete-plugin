/*
 * Copyright (c) 2022, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Config, Plugin, Command } from '@oclif/core';
import { readJson } from '@oclif/core/lib/util/fs.js';
import { expect } from 'chai';

// eslint-disable-next-line no-underscore-dangle
const __filename = fileURLToPath(import.meta.url);
// eslint-disable-next-line no-underscore-dangle
const __dirname = dirname(__filename);

import Create from '../../../src/commands/autocmplt/create.js';

const root = resolve(__dirname, '../../../package.json');
const config = new Config({ root });

const cacheBuildFlagsTest: Command.Loadable = {
  id: 'autocmplt:create',
  flags: {
    targetusername: {
      name: 'targetusername',
      type: 'option',
      description: 'targetusername to use',
    },
    visable: { name: 'visable', type: 'boolean', description: 'visable flag', allowNo: false },
    hidden: {
      name: 'hidden',
      type: 'boolean',
      description: 'hidden flag',
      hidden: true,
      allowNo: false,
    },
  },
  async load(): Promise<Command.Class> {
    return config as unknown as Command.Class;
  },
  hidden: false,
  hiddenAliases: [],
  aliases: [],
  args: {},
};

describe('Create', () => {
  // Unit test private methods for extra coverage
  describe('private methods', () => {
    let cmd: Create;
    let klass: Command.Cached;
    let plugin: Plugin;
    before(async () => {
      await config.load();
      cmd = new Create([], config);
      plugin = new Plugin({ isRoot: true, root });
      const plugins = new Map().set(plugin.name, plugin);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      cmd.config.plugins = plugins;
      await plugin.load();
      plugin.manifest = await readJson(resolve(__dirname, '../../../test/test.oclif.manifest.json'));
      plugin.commands = Object.entries(plugin.manifest.commands as { [s: string]: unknown }).map(([id, c]) => ({
        ...(c as Record<string, unknown>),
        load: async (): Promise<Command.Class> => plugin.findCommand(id, { must: true }) as unknown as Command.Class,
      })) as Command.Loadable[];

      klass = plugin.commands[1] as unknown as Command.Cached;
    });

    it('file paths', () => {
      const dir: string = cmd.config.cacheDir;
      expect(cmd.bashSetupScriptPath).to.eq(`${dir}/autocomplete/bash_setup`);
      expect(cmd.zshSetupScriptPath).to.eq(`${dir}/autocomplete/zsh_setup`);
      expect(cmd.bashCommandsListPath).to.eq(`${dir}/autocomplete/commands`);
      expect(cmd.zshCompletionSettersPath).to.eq(`${dir}/autocomplete/commands_setters`);
    });

    it('#genCmdWithDescription', () => {
      expect(cmd.genCmdWithDescription(klass)).to.eq('"autocmplt\\:foo":"foo cmd for autocomplete testing"');
    });

    it('#genCmdPublicFlags', () => {
      expect(cmd.genCmdPublicFlags(cacheBuildFlagsTest)).to.eq('--targetusername --visable');
      expect(cmd.genCmdPublicFlags(cacheBuildFlagsTest)).to.not.match(/--hidden/);
      expect(cmd.genCmdPublicFlags(Create as unknown as Command.Cached)).to.eq('');
    });

    it('#bashCommandsList', () => {
      expect(cmd.bashCommandsList).to.eq('autocmplt --skip-instructions\nautocmplt:foo --targetusername --bar --json');
    });

    it('#zshCompletionSetters', () => {
      expect(cmd.zshCompletionSetters).to.eq(`
_${cmd.config.bin}_set_all_commands_list () {
_all_commands_list=(
"autocmplt":"display autocomplete instructions"
"autocmplt\\:foo":"foo cmd for autocomplete testing"
)
}

_set_autocmplt_flags () {
_flags=(
"--skip-instructions[(switch) Do not show installation instructions]"
)
}

_set_autocmplt_foo_flags () {
_flags=(
"--targetusername=-[(autocomplete) targetusername to use]: :_compadd_flag_options"
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
SFDX_AC_BASH_COMPFUNC_PATH=${config.cacheDir}/autocomplete/functions/bash/sfdx.bash && test -f $SFDX_AC_BASH_COMPFUNC_PATH && source $SFDX_AC_BASH_COMPFUNC_PATH;
`);
    });

    it('#zshSetupScript', () => {
      process.env.SFDX_AC_ZSH_SKIP_ELLIPSIS = '0';
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
${config.cacheDir}/autocomplete/functions/zsh
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
${config.cacheDir}/autocomplete/functions/zsh
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
_${cmd.config.bin}_set_all_commands_list () {
_all_commands_list=(
"foo\\:alpha":"foo:alpha description"
"foo\\:beta":"foo:beta description"
)
}
`);
    });

    it('#genZshCmdFlagsSetter', () => {
      expect(cmd.genZshCmdFlagsSetter(cacheBuildFlagsTest)).to.eq(`_set_autocmplt_create_flags () {
_flags=(
"--targetusername=-[(autocomplete) targetusername to use]: :_compadd_flag_options"
"--visable[(switch) visable flag]"
)
}
`);
    });
  });
});
