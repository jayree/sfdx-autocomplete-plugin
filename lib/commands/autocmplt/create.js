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
// eslint-disable-next-line camelcase
import child_process from 'node:child_process';
import path from 'node:path';
import fs from 'fs-extra';
import Debug from 'debug';
import { AutocompleteBase } from '../../base.js';
import bashAutocomplete from '../../autocomplete/bash.js';
import bashAutocompleteWithSpaces from '../../autocomplete/bash-spaces.js';
import zshAutocomplete from '../../autocomplete/zsh.js';
import ZshCompWithSpaces from '../../autocomplete/zsh-spaces.js';
import { wantsLocalDirsArray, wantsLocalFilesArray } from '../../autocomplete/wantsLocal.js';
function sanitizeDescription(description) {
    if (description === undefined) {
        return '';
    }
    return (description
        .replace(/([`"])/g, '\\\\\\$1') // backticks and double-quotes require triple-backslashes
        // eslint-disable-next-line no-useless-escape
        .replace(/([\[\]])/g, '\\\\$1') // square brackets require double-backslashes
        .split('\n')[0]); // only use the first line
}
const debug = Debug('autocmplt:create');
export default class Create extends AutocompleteBase {
    static aliases = ['autocomplete:create'];
    static hidden = true;
    static description = 'create autocomplete setup scripts and completion functions';
    _commands;
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
    get zshCompletionSettersPath() {
        // <cacheDir>/autocomplete/commands_setters
        return path.join(this.autocompleteCacheDir, 'commands_setters');
    }
    get bashSetupScript() {
        const bin = this.cliBinEnvVar;
        return `${this.envAnalyticsDir}
${this.envCommandsPath}
${bin}_AC_BASH_COMPFUNC_PATH=${this.bashCompletionFunctionPath} && test -f $${bin}_AC_BASH_COMPFUNC_PATH && source $${bin}_AC_BASH_COMPFUNC_PATH;
`;
    }
    get zshSetupScript() {
        const bin = this.cliBinEnvVar;
        return `${this.skipEllipsis ? '' : this.completionDotsFunc}
${this.envAnalyticsDir}
${this.envCommandsPath}
${bin}_AC_ZSH_SETTERS_PATH=\${${bin}_AC_COMMANDS_PATH}_setters && test -f $${bin}_AC_ZSH_SETTERS_PATH && source $${bin}_AC_ZSH_SETTERS_PATH;
fpath=(
${this.zshFunctionsDir}
$fpath
);
autoload -Uz compinit;
compinit;
`;
    }
    // eslint-disable-next-line class-methods-use-this
    get completionDotsFunc() {
        return `expand-or-complete-with-dots() {
  echo -n "..."
  zle expand-or-complete
  zle redisplay
}
zle -N expand-or-complete-with-dots
bindkey "^I" expand-or-complete-with-dots`;
    }
    get bashCommandsList() {
        return this.commands
            .map((c) => {
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
    get fishSetupScriptPath() {
        // <cacheDir>/autocomplete/clibin.fish
        return path.join(this.autocompleteCacheDir, `${this.cliBin}.fish`);
    }
    // eslint-disable-next-line class-methods-use-this
    get fishCompletionFunctionPath() {
        // dynamically load path to completions file
        // eslint-disable-next-line camelcase
        const dir = child_process.execSync('pkg-config --variable completionsdir fish').toString().trimEnd();
        return `${dir}/${this.cliBin}.fish`;
    }
    // eslint-disable-next-line class-methods-use-this
    get skipEllipsis() {
        return process.env[`${this.cliBinEnvVar}_AC_ZSH_SKIP_ELLIPSIS`] === '1';
    }
    get envAnalyticsDir() {
        return `${this.cliBinEnvVar}_AC_ANALYTICS_DIR=${path.join(this.autocompleteCacheDir, 'completion_analytics')};`;
    }
    get envCommandsPath() {
        return `${this.cliBinEnvVar}_AC_COMMANDS_PATH=${path.join(this.autocompleteCacheDir, 'commands')};`;
    }
    get bashFunctionsDir() {
        // <cachedir>/autocomplete/functions/bash
        return path.join(this.autocompleteCacheDir, 'functions', 'bash');
    }
    get zshFunctionsDir() {
        // <cachedir>/autocomplete/functions/zsh
        return path.join(this.autocompleteCacheDir, 'functions', 'zsh');
    }
    get zshCompletionFunctionPath() {
        // <cachedir>/autocomplete/functions/zsh/_<bin>
        return this.zshFunctionsDir;
    }
    get bashCompletionFunctionPath() {
        // <cachedir>/autocomplete/functions/bash/<bin>.bash
        return path.join(this.bashFunctionsDir, `${this.cliBin}.bash`);
    }
    get zshCommandsSetter() {
        const cmdsWithDescriptions = this.commands.map((c) => {
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
            .map((c) => {
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
    get commands() {
        // eslint-disable-next-line no-underscore-dangle
        if (this._commands)
            return this._commands;
        const plugins = this.config.getPluginsList();
        const commands = [];
        plugins.forEach((p) => {
            p.commands.forEach((c) => {
                try {
                    if (c.hidden)
                        return;
                    if (c.pluginName === '@oclif/plugin-autocomplete')
                        return;
                    const description = sanitizeDescription(c.summary ?? c.description ?? '');
                    const flags = c.flags;
                    const hidden = c.hidden;
                    const hiddenAliases = c.hiddenAliases;
                    const args = c.args;
                    commands.push({
                        id: c.id,
                        description,
                        flags,
                        hidden,
                        hiddenAliases,
                        aliases: c.aliases,
                        args,
                    });
                    c.aliases.forEach((alias) => {
                        commands.push({
                            id: alias,
                            description,
                            flags,
                            hidden,
                            hiddenAliases,
                            aliases: [],
                            args,
                        });
                    });
                }
                catch (err) {
                    debug(`Error creating completions for command ${c.id}`);
                    debug(err.message);
                    this.writeLogFile(err.message);
                }
            });
        });
        // eslint-disable-next-line no-underscore-dangle
        this._commands = commands;
        // eslint-disable-next-line no-underscore-dangle
        return this._commands;
    }
    get bashCommandsWithFlagsList() {
        return this.commands
            .map((c) => {
            const publicFlags = this.genCmdPublicFlags(c).trim();
            return `${c.id} ${publicFlags}`;
        })
            .join('\n');
    }
    get bashCompletionFunction() {
        const cliBin = this.cliBin;
        const supportSpaces = this.config.topicSeparator === ' ';
        const bashScript = process.env.OCLIF_AUTOCOMPLETE_TOPIC_SEPARATOR === 'colon' || !supportSpaces
            ? bashAutocomplete
            : bashAutocompleteWithSpaces;
        return bashScript
            .replace(/<CLI_BIN>/g, cliBin)
            .replace(/<BASH_COMMANDS_WITH_FLAGS_LIST>/g, this.bashCommandsWithFlagsList)
            .replace(/<CLI_BINENV>/g, this.cliBinEnvVar);
    }
    get zshCompletionFunction() {
        const zshScript = zshAutocomplete;
        return zshScript.replace(/<CLI_BINENV>/g, this.cliBinEnvVar).replace(/<CLI_BIN>/g, this.cliBin);
    }
    async run() {
        this.errorIfWindows();
        // 1. ensure needed dirs
        await this.ensureDirs();
        // 2. save (generated) autocomplete files
        await this.createFiles();
    }
    // eslint-disable-next-line class-methods-use-this
    genCmdPublicFlags(command) {
        const flags = command.flags || {};
        return Object.keys(flags)
            .filter((flag) => !flags[flag].hidden)
            .map((flag) => `--${flag}`)
            .join(' ');
    }
    // eslint-disable-next-line class-methods-use-this
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
            .filter((flag) => command.flags && !command.flags[flag].hidden)
            .map((flag) => {
            const f = command.flags?.[flag];
            const isBoolean = f.type === 'boolean';
            const isOption = f.type === 'option';
            const hasCompletion = 
            // eslint-disable-next-line no-prototype-builtins
            f.hasOwnProperty('completion') ||
                // eslint-disable-next-line no-prototype-builtins
                f.hasOwnProperty('options') ||
                this.findCompletion(flag);
            const name = isBoolean ? flag : `${flag}=-`;
            let cachecompl = '';
            if (hasCompletion) {
                cachecompl = ': :_compadd_flag_options';
            }
            if (this.wantsLocalFiles(flag) && command.flags[flag].type === 'option') {
                cachecompl = ': :_files';
            }
            if (this.wantsLocalDirs(flag) && command.flags[flag].type === 'option') {
                cachecompl = ': :_files -/';
            }
            const help = isBoolean ? '(switch) ' : hasCompletion ? '(autocomplete) ' : '';
            const multiple = isOption && f.multiple ? '*' : '';
            const completion = `${multiple}--${name}[${help}${sanitizeDescription(f.summary ?? f.description)}]${cachecompl}`;
            return `"${completion}"`;
        })
            .join('\n');
        if (flagscompletions) {
            return `_set_${id.replace(/:/g, '_')}_flags () {
_flags=(
${flagscompletions}
)
}
`;
        }
        return `# no flags for ${id}`;
    }
    // eslint-disable-next-line class-methods-use-this
    genZshAllCmdsListSetter(cmdsWithDesc) {
        return `
_${this.cliBin}_set_all_commands_list () {
_all_commands_list=(
${cmdsWithDesc.join('\n')}
)
}
`;
    }
    async ensureDirs() {
        // ensure autocomplete cache dir
        await fs.ensureDir(this.autocompleteCacheDir);
        // ensure autocomplete completions dir
        await fs.ensureDir(this.completionsCacheDir);
        // ensure autocomplete bash function dir
        await fs.ensureDir(this.bashFunctionsDir);
        // ensure autocomplete zsh function dir
        await fs.ensureDir(this.zshFunctionsDir);
    }
    async createFiles() {
        if (this.config.shell === 'bash') {
            await fs.writeFile(this.bashSetupScriptPath, this.bashSetupScript);
            await fs.writeFile(this.bashCommandsListPath, this.bashCommandsList);
            await fs.writeFile(this.bashCompletionFunctionPath, this.bashCompletionFunction);
        }
        if (this.config.shell === 'zsh') {
            await fs.writeFile(this.zshSetupScriptPath, this.zshSetupScript);
            await fs.writeFile(this.zshCompletionSettersPath, this.zshCompletionSetters);
            // zsh
            const supportSpaces = this.config.topicSeparator === ' ';
            if (process.env.OCLIF_AUTOCOMPLETE_TOPIC_SEPARATOR === 'colon' || !supportSpaces) {
                await fs.writeFile(path.join(this.zshCompletionFunctionPath, `_${this.cliBin}`), this.zshCompletionFunction);
            }
            else {
                const zshCompWithSpaces = new ZshCompWithSpaces(this.config);
                await fs.writeFile(path.join(this.zshCompletionFunctionPath, `_${this.cliBin}`), await zshCompWithSpaces.generate(this.config.bin));
                await fs.writeFile(path.join(this.zshCompletionFunctionPath, `_sfdx`), await zshCompWithSpaces.generate('sfdx'));
            }
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
    async fishSetupScript() {
        const cliBin = this.cliBin;
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
        for await (const command of this.commands) {
            completions.push(`complete -f -c ${cliBin} -n '__fish_${cliBin}_needs_command' -a ${command.id} -d "${command.description?.split('\n')[0]}"`);
            const flags = command.flags || {};
            const fl = Object.keys(flags).filter((flag) => flags[flag] && !flags[flag].hidden);
            for await (const flag of fl) {
                const f = flags[flag];
                const shortFlag = f.char ? `-s ${f.char}` : '';
                const description = `-d "${sanitizeDescription(f.summary ?? f.description)}"`;
                let options = f.type === 'option' ? `-r -a "${f.options?.join(' ')}"` : '';
                if (options.length === 0) {
                    const cacheKey = f.name;
                    const cacheCompletion = this.findCompletion(cacheKey);
                    if (cacheCompletion) {
                        options = (await this.fetchOptions({ cacheCompletion, cacheKey }));
                        options = `-r -a "${options.split('\n').join(' ')}"`;
                    }
                }
                completions.push(`complete -f -c ${cliBin} -n ' __fish_${cliBin}_using_command ${command.id}' -l ${flag} ${shortFlag} ${options} ${description}`);
            }
        }
        return completions.join('\n');
    }
    // eslint-disable-next-line class-methods-use-this
    wantsLocalFiles(flag) {
        return wantsLocalFilesArray.includes(flag);
    }
    // eslint-disable-next-line class-methods-use-this
    wantsLocalDirs(flag) {
        return wantsLocalDirsArray.includes(flag);
    }
}
//# sourceMappingURL=create.js.map