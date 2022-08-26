/*
 * Copyright (c) 2022, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
// eslint-disable-next-line camelcase
import child_process from 'child_process';
import path from 'path';
import fs from 'fs-extra';
import lodash from 'lodash';
import { Interfaces } from '@oclif/core';
import Debug from 'debug';

import { AutocompleteBase } from '../../base.js';

type CommandCompletion = {
  id: string;
  description: string;
  flags: Record<string, Interfaces.Command.Flag>;
};

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

// eslint-disable-next-line @typescript-eslint/no-var-requires
const debug = Debug('autocmplt:create');

export default class Create extends AutocompleteBase {
  public static aliases = ['autocomplete:create'];

  public static hidden = true;
  public static description = 'create autocomplete setup scripts and completion functions';

  private _commands?: CommandCompletion[];

  private get bashSetupScriptPath(): string {
    // <cacheDir>/autocomplete/bash_setup
    return path.join(this.autocompleteCacheDir, 'bash_setup');
  }

  private get bashCommandsListPath(): string {
    // <cacheDir>/autocomplete/commands
    return path.join(this.autocompleteCacheDir, 'commands');
  }

  private get zshSetupScriptPath(): string {
    // <cacheDir>/autocomplete/zsh_setup
    return path.join(this.autocompleteCacheDir, 'zsh_setup');
  }

  private get fishSetupScriptPath(): string {
    // <cacheDir>/autocomplete/sfdx.fish
    return path.join(this.autocompleteCacheDir, 'sfdx.fish');
  }

  private get zshCompletionSettersPath(): string {
    // <cacheDir>/autocomplete/commands_setters
    return path.join(this.autocompleteCacheDir, 'commands_setters');
  }

  // eslint-disable-next-line class-methods-use-this
  private get fishCompletionFunctionPath(): string {
    // dynamically load path to completions file
    // eslint-disable-next-line camelcase
    const dir = child_process.execSync('pkg-config --variable completionsdir fish').toString().trimRight();
    return `${dir}/sfdx.fish`;
  }

  // eslint-disable-next-line class-methods-use-this
  private get skipEllipsis(): boolean {
    return process.env.SFDX_AC_ZSH_SKIP_ELLIPSIS === '1';
  }

  private get envAnalyticsDir(): string {
    return `SFDX_AC_ANALYTICS_DIR=${path.join(this.autocompleteCacheDir, 'completion_analytics')};`;
  }

  private get envCommandsPath(): string {
    return `SFDX_AC_COMMANDS_PATH=${path.join(this.autocompleteCacheDir, 'commands')};`;
  }

  private get bashSetupScript(): string {
    return `${this.envAnalyticsDir}
${this.envCommandsPath}
SFDX_AC_BASH_COMPFUNC_PATH=${path.join(
      new URL('./', import.meta.url).pathname,
      '..',
      '..',
      '..',
      'autocomplete',
      'bash',
      'sfdx.bash'
    )} && test -f $SFDX_AC_BASH_COMPFUNC_PATH && source $SFDX_AC_BASH_COMPFUNC_PATH;
`;
  }

  private get zshSetupScript(): string {
    return `${this.skipEllipsis ? '' : this.completionDotsFunc}
${this.envAnalyticsDir}
${this.envCommandsPath}
SFDX_AC_ZSH_SETTERS_PATH=\${SFDX_AC_COMMANDS_PATH}_setters && test -f $SFDX_AC_ZSH_SETTERS_PATH && source $SFDX_AC_ZSH_SETTERS_PATH;
fpath=(
${path.join(new URL('./', import.meta.url).pathname, '..', '..', '..', 'autocomplete', 'zsh')}
$fpath
);
autoload -Uz compinit;
compinit;
`;
  }

  // eslint-disable-next-line class-methods-use-this
  private get completionDotsFunc(): string {
    return `expand-or-complete-with-dots() {
  echo -n "..."
  zle expand-or-complete
  zle redisplay
}
zle -N expand-or-complete-with-dots
bindkey "^I" expand-or-complete-with-dots`;
  }

  private get bashCommandsList(): string {
    return this.commands
      .map((c) => {
        try {
          const publicFlags = this.genCmdPublicFlags(c).trim();
          return `${c.id} ${publicFlags}`;
        } catch (err) {
          debug(`Error creating bash completion for command ${c.id}, moving on...`);
          debug(err.message);
          this.writeLogFile(err.message as string);
          return '';
        }
      })
      .join('\n');
  }

  private get zshCompletionSetters(): string {
    const cmdsSetter = this.zshCommandsSetter;
    const flagSetters = this.zshCommandsFlagsSetters;
    return `${cmdsSetter}\n${flagSetters}`;
  }

  private get zshCommandsSetter(): string {
    const cmdsWithDescriptions = this.commands.map((c) => {
      try {
        return this.genCmdWithDescription(c);
      } catch (err) {
        debug(`Error creating zsh autocomplete for command ${c.id}, moving on...`);
        debug(err.message);
        this.writeLogFile(err.message as string);
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
          debug(err.message);
          this.writeLogFile(err.message as string);
          return '';
        }
      })
      .join('\n');
  }

  private get commands(): CommandCompletion[] {
    // eslint-disable-next-line no-underscore-dangle
    if (this._commands) return this._commands;

    const plugins = this.config.plugins;
    const commands: CommandCompletion[] = [];

    plugins.map((p) => {
      p.commands.map((c) => {
        if (c.hidden) return;
        if (c.pluginName === '@oclif/plugin-autocomplete') return;
        try {
          commands.push({
            id: c.id,
            description: sanitizeDescription(c.description || ''),
            flags: c.flags,
          });
          for (const alias of c.aliases) {
            const clone = lodash.cloneDeep({
              id: c.id,
              description: sanitizeDescription(c.description || ''),
              flags: c.flags,
            }) as CommandCompletion;
            clone.id = alias;
            commands.push(clone);
          }
        } catch (err) {
          debug(`Error creating completions for command ${c.id}`);
          debug(err.message);
          this.writeLogFile(err.message as string);
        }
      });
    });

    // eslint-disable-next-line no-underscore-dangle
    this._commands = commands;
    // eslint-disable-next-line no-underscore-dangle
    return this._commands;
  }

  public async run() {
    this.errorIfWindows();
    // 1. ensure needed dirs
    await this.ensureDirs();
    // 2. save (generated) autocomplete files
    await this.createFiles();
  }

  private async ensureDirs() {
    // ensure autocomplete cache dir
    await fs.ensureDir(this.autocompleteCacheDir);
    // ensure autocomplete completions dir
    await fs.ensureDir(this.completionsCacheDir);
  }

  private async createFiles() {
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
      } catch (error) {
        await fs.symlink(this.fishSetupScriptPath, this.fishCompletionFunctionPath);
      }
    }
  }

  private async fishSetupScript(): Promise<string> {
    const cliBin = this.config.bin;
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
      // tslint:disable-next-line: no-any
      const flags: Record<string, Interfaces.Command.Flag> = command.flags || {};
      const fl = Object.keys(flags).filter((flag) => flags[flag] && !flags[flag].hidden);

      for await (const flag of fl) {
        const f: Interfaces.Command.Flag = flags[flag];
        const shortFlag = f.char ? `-s ${f.char}` : '';
        const description = f.description ? `-d "${f.description}"` : '';
        let options = f['options'] ? `-r -a "${f['options'].join(' ')}"` : '';
        if (options.length === 0) {
          const cacheKey: string = f.name;
          const cacheCompletion = this.findCompletion(command.id, cacheKey);
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
  private genCmdPublicFlags(command: CommandCompletion): string {
    const flags: Record<string, Interfaces.Command.Flag> = command.flags || {};
    return Object.keys(flags)
      .filter((flag) => !flags[flag].hidden)
      .map((flag) => `--${flag}`)
      .join(' ');
  }

  // eslint-disable-next-line class-methods-use-this
  private genCmdWithDescription(command: CommandCompletion): string {
    let description = '';
    if (command.description) {
      const text = command.description.split('\n')[0];
      description = `:"${text}"`;
    }
    return `"${command.id.replace(/:/g, '\\:')}"${description}`;
  }

  private genZshCmdFlagsSetter(command: CommandCompletion): string {
    const id = command.id;
    const flagscompletions = Object.keys(command.flags || {})
      .filter((flag) => command.flags && !command.flags[flag].hidden)
      .map((flag) => {
        const f: Interfaces.Command.Flag =
          command.flags?.[flag] ||
          // tslint:disable-next-line: no-any
          ({ description: '' } as any);
        const isBoolean = f.type === 'boolean';
        const hasCompletion =
          // eslint-disable-next-line no-prototype-builtins
          f.hasOwnProperty('completion') || f.hasOwnProperty('options') || this.findCompletion(id, flag, f.description);
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

  // eslint-disable-next-line class-methods-use-this
  private genZshAllCmdsListSetter(cmdsWithDesc: string[]): string {
    return `
_sfdx_set_all_commands_list () {
_sfdx_all_commands_list=(
${cmdsWithDesc.join('\n')}
)
}
`;
  }

  // eslint-disable-next-line class-methods-use-this
  private wantsLocalFiles(flag: string): boolean {
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
      'zipfile',
    ].includes(flag);
  }
}
