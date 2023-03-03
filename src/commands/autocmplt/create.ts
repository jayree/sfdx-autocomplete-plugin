/*
 * Copyright (c) 2022, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
// eslint-disable-next-line camelcase
import child_process from 'node:child_process';
import path from 'node:path';
import fs from 'fs-extra';
// eslint-disable-next-line sf-plugin/no-oclif-flags-command-import
import { Command } from '@oclif/core';
import Debug from 'debug';

import { AutocompleteBase } from '../../base.js';
import bashAutocomplete from '../../autocomplete/bash.js';
import bashAutocompleteWithSpaces from '../../autocomplete/bash-spaces.js';
import zshAutocomplete from '../../autocomplete/zsh.js';
import ZshCompWithSpaces from '../../autocomplete/zsh-spaces.js';
import { wantsLocalDirsArray, wantsLocalFilesArray } from '../../autocomplete/wantsLocal.js';

function sanitizeDescription(description?: string): string {
  if (description === undefined) {
    return '';
  }
  return (
    description
      .replace(/([`"])/g, '\\\\\\$1') // backticks and double-quotes require triple-backslashes
      // eslint-disable-next-line no-useless-escape
      .replace(/([\[\]])/g, '\\\\$1') // square brackets require double-backslashes
      .split('\n')[0]
  ); // only use the first line
}

const debug = Debug('autocmplt:create');

export default class Create extends AutocompleteBase {
  public static aliases = ['autocomplete:create'];

  public static hidden = true;
  public static readonly description = 'create autocomplete setup scripts and completion functions';

  private _commands?: Command.Cached[];

  public get bashSetupScriptPath(): string {
    // <cacheDir>/autocomplete/bash_setup
    return path.join(this.autocompleteCacheDir, 'bash_setup');
  }

  public get bashCommandsListPath(): string {
    // <cacheDir>/autocomplete/commands
    return path.join(this.autocompleteCacheDir, 'commands');
  }

  public get zshSetupScriptPath(): string {
    // <cacheDir>/autocomplete/zsh_setup
    return path.join(this.autocompleteCacheDir, 'zsh_setup');
  }

  public get zshCompletionSettersPath(): string {
    // <cacheDir>/autocomplete/commands_setters
    return path.join(this.autocompleteCacheDir, 'commands_setters');
  }

  public get bashSetupScript(): string {
    const bin = this.cliBinEnvVar;
    return `${this.envAnalyticsDir}
${this.envCommandsPath}
${bin}_AC_BASH_COMPFUNC_PATH=${this.bashCompletionFunctionPath} && test -f $${bin}_AC_BASH_COMPFUNC_PATH && source $${bin}_AC_BASH_COMPFUNC_PATH;
`;
  }

  public get zshSetupScript(): string {
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
  public get completionDotsFunc(): string {
    return `expand-or-complete-with-dots() {
  echo -n "..."
  zle expand-or-complete
  zle redisplay
}
zle -N expand-or-complete-with-dots
bindkey "^I" expand-or-complete-with-dots`;
  }

  public get bashCommandsList(): string {
    return this.commands
      .map((c) => {
        try {
          const publicFlags = this.genCmdPublicFlags(c).trim();
          return `${c.id} ${publicFlags}`;
        } catch (err) {
          debug(`Error creating bash completion for command ${c.id}, moving on...`);
          debug((err as Error).message);
          this.writeLogFile((err as Error).message);
          return '';
        }
      })
      .join('\n');
  }

  public get zshCompletionSetters(): string {
    const cmdsSetter = this.zshCommandsSetter;
    const flagSetters = this.zshCommandsFlagsSetters;
    return `${cmdsSetter}\n${flagSetters}`;
  }

  private get fishSetupScriptPath(): string {
    // <cacheDir>/autocomplete/clibin.fish
    return path.join(this.autocompleteCacheDir, `${this.cliBin}.fish`);
  }

  // eslint-disable-next-line class-methods-use-this
  private get fishCompletionFunctionPath(): string {
    // dynamically load path to completions file
    // eslint-disable-next-line camelcase
    const dir = child_process.execSync('pkg-config --variable completionsdir fish').toString().trimEnd();
    return `${dir}/${this.cliBin}.fish`;
  }

  // eslint-disable-next-line class-methods-use-this
  private get skipEllipsis(): boolean {
    return process.env[`${this.cliBinEnvVar}_AC_ZSH_SKIP_ELLIPSIS`] === '1';
  }

  private get envAnalyticsDir(): string {
    return `${this.cliBinEnvVar}_AC_ANALYTICS_DIR=${path.join(this.autocompleteCacheDir, 'completion_analytics')};`;
  }

  private get envCommandsPath(): string {
    return `${this.cliBinEnvVar}_AC_COMMANDS_PATH=${path.join(this.autocompleteCacheDir, 'commands')};`;
  }

  private get bashFunctionsDir(): string {
    // <cachedir>/autocomplete/functions/bash
    return path.join(this.autocompleteCacheDir, 'functions', 'bash');
  }

  private get zshFunctionsDir(): string {
    // <cachedir>/autocomplete/functions/zsh
    return path.join(this.autocompleteCacheDir, 'functions', 'zsh');
  }

  private get zshCompletionFunctionPath(): string {
    // <cachedir>/autocomplete/functions/zsh/_<bin>
    return path.join(this.zshFunctionsDir, `_${this.cliBin}`);
  }

  private get bashCompletionFunctionPath(): string {
    // <cachedir>/autocomplete/functions/bash/<bin>.bash
    return path.join(this.bashFunctionsDir, `${this.cliBin}.bash`);
  }

  private get zshCommandsSetter(): string {
    const cmdsWithDescriptions = this.commands.map((c) => {
      try {
        return this.genCmdWithDescription(c);
      } catch (err) {
        debug(`Error creating zsh autocomplete for command ${c.id}, moving on...`);
        debug((err as Error).message);
        this.writeLogFile((err as Error).message);
        return '';
      }
    });

    return this.genZshAllCmdsListSetter(cmdsWithDescriptions);
  }

  private get zshCommandsFlagsSetters(): string {
    return this.commands
      .map((c) => {
        try {
          return this.genZshCmdFlagsSetter(c);
        } catch (err) {
          debug(`Error creating zsh autocomplete for command ${c.id}, moving on...`);
          debug((err as Error).message);
          this.writeLogFile((err as Error).message);
          return '';
        }
      })
      .join('\n');
  }

  private get commands(): Command.Cached[] {
    // eslint-disable-next-line no-underscore-dangle
    if (this._commands) return this._commands;

    const plugins = this.config.plugins;
    const commands: Command.Cached[] = [];

    plugins.forEach((p) => {
      p.commands.forEach((c) => {
        try {
          if (c.hidden) return;
          if (c.pluginName === '@oclif/plugin-autocomplete') return;
          const description = sanitizeDescription(c.summary || c.description || '');
          const flags = c.flags;
          const hidden = c.hidden;
          const args = c.args;
          commands.push({
            id: c.id,
            description,
            flags,
            hidden,
            aliases: c.aliases,
            args,
          });
          c.aliases.forEach((alias) => {
            commands.push({
              id: alias,
              description,
              flags,
              hidden,
              aliases: [],
              args,
            });
          });
        } catch (err) {
          debug(`Error creating completions for command ${c.id}`);
          debug((err as Error).message);
          this.writeLogFile((err as Error).message);
        }
      });
    });

    // eslint-disable-next-line no-underscore-dangle
    this._commands = commands;
    // eslint-disable-next-line no-underscore-dangle
    return this._commands;
  }

  private get bashCommandsWithFlagsList(): string {
    return this.commands
      .map((c) => {
        const publicFlags = this.genCmdPublicFlags(c).trim();
        return `${c.id} ${publicFlags}`;
      })
      .join('\n');
  }

  private get bashCompletionFunction(): string {
    const cliBin = this.cliBin;
    const supportSpaces = this.config.topicSeparator === ' ';
    const bashScript =
      process.env.OCLIF_AUTOCOMPLETE_TOPIC_SEPARATOR === 'colon' || !supportSpaces
        ? bashAutocomplete
        : bashAutocompleteWithSpaces;
    return bashScript
      .replace(/<CLI_BIN>/g, cliBin)
      .replace(/<BASH_COMMANDS_WITH_FLAGS_LIST>/g, this.bashCommandsWithFlagsList)
      .replace(/<CLI_BINENV>/g, this.cliBinEnvVar);
  }

  private get zshCompletionFunction(): string {
    const zshScript = zshAutocomplete;
    return zshScript.replace(/<CLI_BINENV>/g, this.cliBinEnvVar).replace(/<CLI_BIN>/g, this.cliBin);
  }

  public async run(): Promise<void> {
    this.errorIfWindows();
    // 1. ensure needed dirs
    await this.ensureDirs();
    // 2. save (generated) autocomplete files
    await this.createFiles();
  }

  // eslint-disable-next-line class-methods-use-this
  public genCmdPublicFlags(command: Command.Cached): string {
    const flags = command.flags || {};
    return Object.keys(flags)
      .filter((flag) => !flags[flag].hidden)
      .map((flag) => `--${flag}`)
      .join(' ');
  }

  // eslint-disable-next-line class-methods-use-this
  public genCmdWithDescription(command: Command.Cached): string {
    let description = '';
    if (command.description) {
      const text = command.description.split('\n')[0];
      description = `:"${text}"`;
    }
    return `"${command.id.replace(/:/g, '\\:')}"${description}`;
  }

  public genZshCmdFlagsSetter(command: Command.Cached): string {
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
        const completion = `${multiple}--${name}[${help}${sanitizeDescription(
          f.summary || f.description
        )}]${cachecompl}`;
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
  public genZshAllCmdsListSetter(cmdsWithDesc: string[]): string {
    return `
_${this.cliBin}_set_all_commands_list () {
_all_commands_list=(
${cmdsWithDesc.join('\n')}
)
}
`;
  }

  private async ensureDirs(): Promise<void> {
    // ensure autocomplete cache dir
    await fs.ensureDir(this.autocompleteCacheDir);
    // ensure autocomplete completions dir
    await fs.ensureDir(this.completionsCacheDir);
    // ensure autocomplete bash function dir
    await fs.ensureDir(this.bashFunctionsDir);
    // ensure autocomplete zsh function dir
    await fs.ensureDir(this.zshFunctionsDir);
  }

  private async createFiles(): Promise<void> {
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
        await fs.writeFile(this.zshCompletionFunctionPath, this.zshCompletionFunction);
      } else {
        const zshCompWithSpaces = new ZshCompWithSpaces(this.config);
        await fs.writeFile(this.zshCompletionFunctionPath, await zshCompWithSpaces.generate());
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
      } catch (error) {
        await fs.symlink(this.fishSetupScriptPath, this.fishCompletionFunctionPath);
      }
    }
  }

  private async fishSetupScript(): Promise<string> {
    const cliBin = this.cliBin;
    const completions: string[] = [];
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
      completions.push(
        `complete -f -c ${cliBin} -n '__fish_${cliBin}_needs_command' -a ${command.id} -d "${
          command.description.split('\n')[0]
        }"`
      );
      const flags: {
        [name: string]: Command.Flag.Cached;
      } = command.flags || {};
      const fl = Object.keys(flags).filter((flag) => flags[flag] && !flags[flag].hidden);

      for await (const flag of fl) {
        const f = flags[flag];
        const shortFlag = f.char ? `-s ${f.char}` : '';
        const description = `-d "${sanitizeDescription(f.summary || f.description)}"`;
        let options = f.type === 'option' ? `-r -a "${f.options.join(' ')}"` : '';
        if (options.length === 0) {
          const cacheKey: string = f.name;
          const cacheCompletion = this.findCompletion(cacheKey);
          if (cacheCompletion) {
            options = await this.fetchOptions({ cacheCompletion, cacheKey });
            options = `-r -a "${options.split('\n').join(' ')}"`;
          }
        }
        completions.push(
          `complete -f -c ${cliBin} -n ' __fish_${cliBin}_using_command ${command.id}' -l ${flag} ${shortFlag} ${options} ${description}`
        );
      }
    }
    return completions.join('\n');
  }

  // eslint-disable-next-line class-methods-use-this
  private wantsLocalFiles(flag: string): boolean {
    return wantsLocalFilesArray.includes(flag);
  }

  // eslint-disable-next-line class-methods-use-this
  private wantsLocalDirs(flag: string): boolean {
    return wantsLocalDirsArray.includes(flag);
  }
}
