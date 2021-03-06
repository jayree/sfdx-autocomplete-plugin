"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const child_process = tslib_1.__importStar(require("child_process"));
const fs = tslib_1.__importStar(require("fs-extra"));
const lodash_1 = require("lodash");
const path = tslib_1.__importStar(require("path"));
const base_1 = require("../../base");
// tslint:disable-next-line: no-var-requires
const debug = require('debug')('autocmplt:create');
class Create extends base_1.AutocompleteBase {
    async run() {
        this.errorIfWindows();
        // 1. ensure needed dirs
        await this.ensureDirs();
        // 2. save (generated) autocomplete files
        await this.createFiles();
    }
    async ensureDirs() {
        // ensure autocomplete cache dir
        await fs.ensureDir(this.autocompleteCacheDir);
        // ensure autocomplete completions dir
        await fs.ensureDir(this.completionsCacheDir);
    }
    async createFiles() {
        if (this.config.shell === 'bash') {
            await fs.writeFile(this.bashSetupScriptPath, this.bashSetupScript);
            await fs.writeFile(this.bashCommandsListPath, this.bashCommandsList);
        }
        if (this.config.shell === 'zsh') {
            await fs.writeFile(this.zshSetupScriptPath, this.zshSetupScript);
            await fs.writeFile(this.zshCompletionSettersPath, this.zshCompletionSetters);
        }
        if (this.config.shell === 'fish') {
            await fs.writeFile(this.fishSetupScriptPath, await this.fishSetupScript());
            try {
                await fs.access(this.fishCompletionFunctionPath);
                if ((await fs.readlink(this.fishCompletionFunctionPath)) !== this.fishSetupScriptPath) {
                    await fs.unlink(this.fishCompletionFunctionPath);
                    await fs.symlink(this.fishSetupScriptPath, this.fishCompletionFunctionPath);
                }
            }
            catch (error) {
                await fs.symlink(this.fishSetupScriptPath, this.fishCompletionFunctionPath);
            }
        }
    }
    get bashSetupScriptPath() {
        // <cacheDir>/autocomplete/bash_setup
        return path.join(this.autocompleteCacheDir, 'bash_setup');
    }
    get bashCommandsListPath() {
        // <cacheDir>/autocomplete/commands
        return path.join(this.autocompleteCacheDir, 'commands');
    }
    get zshSetupScriptPath() {
        // <cacheDir>/autocomplete/zsh_setup
        return path.join(this.autocompleteCacheDir, 'zsh_setup');
    }
    get fishSetupScriptPath() {
        // <cacheDir>/autocomplete/sfdx.fish
        return path.join(this.autocompleteCacheDir, 'sfdx.fish');
    }
    get zshCompletionSettersPath() {
        // <cacheDir>/autocomplete/commands_setters
        return path.join(this.autocompleteCacheDir, 'commands_setters');
    }
    get fishCompletionFunctionPath() {
        // dynamically load path to completions file
        const dir = child_process
            .execSync('pkg-config --variable completionsdir fish')
            .toString()
            .trimRight();
        return `${dir}/sfdx.fish`;
    }
    async fishSetupScript() {
        const cliBin = this.config.bin;
        const completions = [];
        completions.push(`
function __fish_${cliBin}_needs_command
  set cmd (commandline -opc)
  if [ (count $cmd) -eq 1 ]
    return 0
  else
    return 1
  end
end
function  __fish_${cliBin}_using_command
  set cmd (commandline -opc)
  if [ (count $cmd) -gt 1 ]
    if [ $argv[1] = $cmd[2] ]
      return 0
    end
  end
  return 1
end`);
        for (const command of this.commands) {
            completions.push(`complete -f -c ${cliBin} -n '__fish_${cliBin}_needs_command' -a ${command.id} -d "${command.description.split('\n')[0]}"`);
            // tslint:disable-next-line: no-any
            const flags = command.flags || {};
            const fl = Object.keys(flags).filter(flag => flags[flag] && !flags[flag].hidden);
            for (const flag of fl) {
                const f = flags[flag] || {};
                const shortFlag = f.char ? `-s ${f.char}` : '';
                const description = f.description ? `-d "${f.description}"` : '';
                let options = f.options ? `-r -a "${f.options.join(' ')}"` : '';
                if (options.length === 0) {
                    const cacheKey = f.name;
                    const cacheCompletion = this.findCompletion(command.id, cacheKey);
                    if (cacheCompletion) {
                        options = await this.fetchOptions({ cacheCompletion, cacheKey });
                        options = `-r -a "${options.split('\n').join(' ')}"`;
                    }
                }
                completions.push(`complete -f -c ${cliBin} -n ' __fish_${cliBin}_using_command ${command.id}' -l ${flag} ${shortFlag} ${options} ${description}`);
            }
        }
        return completions.join('\n');
    }
    get skipEllipsis() {
        return process.env.SFDX_AC_ZSH_SKIP_ELLIPSIS === '1';
    }
    get commands() {
        if (this._commands)
            return this._commands;
        const plugins = this.config.plugins;
        const commands = [];
        plugins.map(p => {
            p.commands.map(c => {
                if (c.hidden)
                    return;
                if (c.pluginName === '@oclif/plugin-autocomplete')
                    return;
                try {
                    commands.push(c);
                    for (const alias of c.aliases) {
                        const clone = lodash_1.cloneDeep(c);
                        clone.id = alias;
                        commands.push(clone);
                    }
                }
                catch (err) {
                    debug(`Error creating completions for command ${c.id}`);
                    debug(err.message);
                    this.writeLogFile(err.message);
                }
            });
        });
        this._commands = commands;
        return this._commands;
    }
    get bashCommandsList() {
        return this.commands
            .map(c => {
            try {
                const publicFlags = this.genCmdPublicFlags(c).trim();
                return `${c.id} ${publicFlags}`;
            }
            catch (err) {
                debug(`Error creating bash completion for command ${c.id}, moving on...`);
                debug(err.message);
                this.writeLogFile(err.message);
                return '';
            }
        })
            .join('\n');
    }
    get zshCompletionSetters() {
        const cmdsSetter = this.zshCommandsSetter;
        const flagSetters = this.zshCommandsFlagsSetters;
        return `${cmdsSetter}\n${flagSetters}`;
    }
    get zshCommandsSetter() {
        const cmdsWithDescriptions = this.commands.map(c => {
            try {
                return this.genCmdWithDescription(c);
            }
            catch (err) {
                debug(`Error creating zsh autocomplete for command ${c.id}, moving on...`);
                debug(err.message);
                this.writeLogFile(err.message);
                return '';
            }
        });
        return this.genZshAllCmdsListSetter(cmdsWithDescriptions);
    }
    get zshCommandsFlagsSetters() {
        return this.commands
            .map(c => {
            try {
                return this.genZshCmdFlagsSetter(c);
            }
            catch (err) {
                debug(`Error creating zsh autocomplete for command ${c.id}, moving on...`);
                debug(err.message);
                this.writeLogFile(err.message);
                return '';
            }
        })
            .join('\n');
    }
    genCmdPublicFlags(command) {
        const flags = command.flags || {};
        return Object.keys(flags)
            .filter(flag => !flags[flag].hidden)
            .map(flag => `--${flag}`)
            .join(' ');
    }
    genCmdWithDescription(command) {
        let description = '';
        if (command.description) {
            const text = command.description.split('\n')[0];
            description = `:"${text}"`;
        }
        return `"${command.id.replace(/:/g, '\\:')}"${description}`;
    }
    genZshCmdFlagsSetter(command) {
        const id = command.id;
        const flagscompletions = Object.keys(command.flags || {})
            .filter(flag => command.flags && !command.flags[flag].hidden)
            .map(flag => {
            const f = (command.flags && command.flags[flag]) ||
                // tslint:disable-next-line: no-any
                { description: '' };
            const isBoolean = f.type === 'boolean';
            const hasCompletion = f.hasOwnProperty('completion') || f.hasOwnProperty('options') || this.findCompletion(id, flag, f.description);
            const name = isBoolean ? flag : `${flag}=-`;
            let cachecompl = '';
            if (hasCompletion) {
                cachecompl = ': :_sfdx_compadd_flag_options';
            }
            if (this.wantsLocalFiles(flag) && command.flags[flag].type === 'option') {
                cachecompl = ': :_files';
            }
            const help = isBoolean ? '(switch) ' : hasCompletion ? '(autocomplete) ' : '';
            const completion = `--${name}[${help}${f.description}]${cachecompl}`;
            return `"${completion}"`;
        })
            .join('\n');
        if (flagscompletions) {
            return `_sfdx_set_${id.replace(/:/g, '_')}_flags () {
_sfdx_flags=(
${flagscompletions}
)
}
`;
        }
        return `# no flags for ${id}`;
    }
    genZshAllCmdsListSetter(cmdsWithDesc) {
        return `
_sfdx_set_all_commands_list () {
_sfdx_all_commands_list=(
${cmdsWithDesc.join('\n')}
)
}
`;
    }
    get envAnalyticsDir() {
        return `SFDX_AC_ANALYTICS_DIR=${path.join(this.autocompleteCacheDir, 'completion_analytics')};`;
    }
    get envCommandsPath() {
        return `SFDX_AC_COMMANDS_PATH=${path.join(this.autocompleteCacheDir, 'commands')};`;
    }
    get bashSetupScript() {
        return `${this.envAnalyticsDir}
${this.envCommandsPath}
SFDX_AC_BASH_COMPFUNC_PATH=${path.join(__dirname, '..', '..', '..', '..', 'autocomplete', 'bash', 'sfdx.bash')} && test -f $SFDX_AC_BASH_COMPFUNC_PATH && source $SFDX_AC_BASH_COMPFUNC_PATH;
`;
    }
    get zshSetupScript() {
        return `${this.skipEllipsis ? '' : this.completionDotsFunc}
${this.envAnalyticsDir}
${this.envCommandsPath}
SFDX_AC_ZSH_SETTERS_PATH=\${SFDX_AC_COMMANDS_PATH}_setters && test -f $SFDX_AC_ZSH_SETTERS_PATH && source $SFDX_AC_ZSH_SETTERS_PATH;
fpath=(
${path.join(__dirname, '..', '..', '..', '..', 'autocomplete', 'zsh')}
$fpath
);
autoload -Uz compinit;
compinit;
`;
    }
    get completionDotsFunc() {
        return `expand-or-complete-with-dots() {
  echo -n "..."
  zle expand-or-complete
  zle redisplay
}
zle -N expand-or-complete-with-dots
bindkey "^I" expand-or-complete-with-dots`;
    }
    wantsLocalFiles(flag) {
        return [
            'apexcodefile',
            'config',
            'configfile',
            'csvfile',
            'definitionfile',
            'deploydir',
            'file',
            'jwtkeyfile',
            'manifest',
            'outputdir',
            'privatekeypath',
            'resultfile',
            'retrievetargetdir',
            'rootdir',
            'sfdxurlfile',
            'sobjecttreefiles',
            'sourcefile',
            'sourcepath',
            'unpackaged',
            'zipfile'
        ].includes(flag);
    }
}
exports.default = Create;
Create.aliases = ['autocomplete:create'];
Create.hidden = true;
Create.description = 'create autocomplete setup scripts and completion functions';
//# sourceMappingURL=create.js.map