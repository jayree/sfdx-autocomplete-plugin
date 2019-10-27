"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("@oclif/config");
const util_1 = require("@oclif/config/lib/util");
const chai_1 = require("chai");
const path = require("path");
const create_1 = require("../../../src/commands/autocomplete/create");
const root = path.resolve(__dirname, '../../../../package.json');
const config = new config_1.Config({ root });
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
        let cmd;
        // tslint:disable-next-line: no-any
        let klass;
        // tslint:disable-next-line: no-any
        let plugin;
        before(async () => {
            await config.load();
            cmd = new create_1.default([], config);
            plugin = new config_1.Plugin({ root });
            cmd.config.plugins = [plugin];
            await plugin.load();
            plugin.manifest = await util_1.loadJSON(path.resolve(__dirname, '../../../../test/test.oclif.manifest.json'));
            plugin.commands = Object.entries(plugin.manifest.commands).map(([id, c]) => (Object.assign(Object.assign({}, c), { load: () => plugin.findCommand(id, { must: true }) })));
            klass = plugin.commands[1];
        });
        it('file paths', () => {
            const dir = cmd.config.cacheDir;
            chai_1.expect(cmd.bashSetupScriptPath).to.eq(`${dir}/autocomplete/bash_setup`);
            chai_1.expect(cmd.zshSetupScriptPath).to.eq(`${dir}/autocomplete/zsh_setup`);
            chai_1.expect(cmd.bashCommandsListPath).to.eq(`${dir}/autocomplete/commands`);
            chai_1.expect(cmd.zshCompletionSettersPath).to.eq(`${dir}/autocomplete/commands_setters`);
        });
        it('#genCmdWithDescription', () => {
            chai_1.expect(cmd.genCmdWithDescription(klass)).to.eq('"autocomplete\\:foo":"foo cmd for autocomplete testing"');
        });
        it('#genCmdPublicFlags', () => {
            chai_1.expect(cmd.genCmdPublicFlags(cacheBuildFlagsTest)).to.eq('--targetusername --visable');
            chai_1.expect(cmd.genCmdPublicFlags(cacheBuildFlagsTest)).to.not.match(/--hidden/);
            chai_1.expect(cmd.genCmdPublicFlags(create_1.default)).to.eq('--json --loglevel');
        });
        it('#bashCommandsList', () => {
            chai_1.expect(cmd.bashCommandsList).to.eq('autocomplete --skip-instructions\nautocomplete:foo --targetusername --bar --json');
        });
        it('#zshCompletionSetters', () => {
            chai_1.expect(cmd.zshCompletionSetters).to.eq(`
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
            chai_1.expect(cmd.completionDotsFunc).to.eq(`expand-or-complete-with-dots() {
  echo -n "..."
  zle expand-or-complete
  zle redisplay
}
zle -N expand-or-complete-with-dots
bindkey "^I" expand-or-complete-with-dots`);
        });
        it('#bashSetupScript', () => {
            const shellSetup = cmd.bashSetupScript;
            chai_1.expect(shellSetup).to.eq(`SFDX_AC_ANALYTICS_DIR=${cmd.config.cacheDir}/autocomplete/completion_analytics;
SFDX_AC_COMMANDS_PATH=${cmd.config.cacheDir}/autocomplete/commands;
SFDX_AC_BASH_COMPFUNC_PATH=${AC_PLUGIN_PATH}/autocomplete/bash/sfdx.bash && test -f $SFDX_AC_BASH_COMPFUNC_PATH && source $SFDX_AC_BASH_COMPFUNC_PATH;
`);
        });
        it('#zshSetupScript', () => {
            const shellSetup = cmd.zshSetupScript;
            chai_1.expect(shellSetup).to.eq(`expand-or-complete-with-dots() {
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
            chai_1.expect(shellSetup).to.eq(`
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
            chai_1.expect(cmd.genZshAllCmdsListSetter(cmdsWithDesc)).to.eq(`
_sfdx_set_all_commands_list () {
_sfdx_all_commands_list=(
"foo\\:alpha":"foo:alpha description"
"foo\\:beta":"foo:beta description"
)
}
`);
        });
        it('#genZshCmdFlagsSetter', () => {
            chai_1.expect(cmd.genZshCmdFlagsSetter(cacheBuildFlagsTest)).to.eq(`_sfdx_set_autocomplete_create_flags () {
_sfdx_flags=(
"--targetusername=-[(autocomplete) targetusername to use]: :_sfdx_compadd_flag_options"
"--visable[(switch) visable flag]"
)
}
`);
        });
    });
});
//# sourceMappingURL=create.test.js.map