import { Command } from '@oclif/config';
import { flags } from '@salesforce/command';
import * as fs from 'fs-extra';
import * as path from 'path';

import { AutocompleteBase } from '../../base';

type CommandCompletion = {
  id: string;
  description: string;
  flags: typeof flags;
};

export default class Create extends AutocompleteBase {
  private get bashSetupScriptPath(): string {
    // <cachedir>/autocomplete/bash_setup
    return path.join(this.autocompleteCacheDir, 'bash_setup');
  }

  private get bashCommandsListPath(): string {
    // <cacheDir>/autocomplete/commands
    return path.join(this.autocompleteCacheDir, 'commands');
  }

  private get zshSetupScriptPath(): string {
    // <cachedir>/autocomplete/zsh_setup
    return path.join(this.autocompleteCacheDir, 'zsh_setup');
  }

  private get zshCompletionSettersPath(): string {
    // <cacheDir>/autocomplete/commands_setters
    return path.join(this.autocompleteCacheDir, 'commands_setters');
  }

  private get envAnalyticsDir(): string {
    return `SFDX_AC_ANALYTICS_DIR=${path.join(this.autocompleteCacheDir, 'completion_analytics')};`;
  }

  private get bashSetupScript(): string {
    return `${this.envAnalyticsDir}
${this.envCommandsPath}
SFDX_AC_BASH_COMPFUNC_PATH=${path.join(
      __dirname,
      '..',
      '..',
      '..',
      '..',
      'autocomplete',
      'bash',
      'sfdx.bash'
    )} && test -f $SFDX_AC_BASH_COMPFUNC_PATH && source $SFDX_AC_BASH_COMPFUNC_PATH;
`;
  }

  private get envCommandsPath(): string {
    return `SFDX_AC_COMMANDS_PATH=${path.join(this.autocompleteCacheDir, 'commands')};`;
  }

  private get skipEllipsis(): boolean {
    return process.env.SFDX_AC_ZSH_SKIP_ELLIPSIS === '1';
  }

  private get completionDotsFunc(): string {
    return `expand-or-complete-with-dots() {
  echo -n "..."
  zle expand-or-complete
  zle redisplay
}
zle -N expand-or-complete-with-dots
bindkey "^I" expand-or-complete-with-dots`;
  }

  private get zshSetupScript(): string {
    return `${this.skipEllipsis ? '' : this.completionDotsFunc}
${this.envAnalyticsDir}
${this.envCommandsPath}
SFDX_AC_ZSH_SETTERS_PATH=\${SFDX_AC_COMMANDS_PATH}_setters && test -f $SFDX_AC_ZSH_SETTERS_PATH && source $SFDX_AC_ZSH_SETTERS_PATH;
fpath=(
${path.join(__dirname, '..', '..', '..', '..', 'autocomplete', 'zsh')}
$fpath
);
autoload -Uz compinit;
compinit;\n`;
  }

  private get commands(): CommandCompletion[] {
    if (this._commands) return this._commands;

    const plugins = this.config.plugins;
    const cmds: CommandCompletion[] = [];

    plugins.map(p => {
      p.commands.map(c => {
        try {
          if (c.hidden) return;
          cmds.push({
            id: c.id,
            description: c.description || '',
            // tslint:disable-next-line: no-any
            flags: c.flags as any
          });
        } catch (err) /* istanbul ignore next*/ {
          this.ux.error(`Error creating zsh flag spec for command ${c.id}`);
          this.ux.error(err.message);
          this.logger.error(err.message);
        }
      });
    });

    this._commands = cmds;

    return this._commands;
  }

  public static hidden = true;
  public static description = 'create autocomplete setup scripts and completion functions';

  private _commands?: CommandCompletion[];

  public async run() {
    this.errorIfWindows();
    // 1. ensure needed dirs
    await this.ensureDirs();
    // 2. ensure cached commands
    await this.ensureCommands();
    // 3. save (generated) autocomplete files
    await this.createFiles();
  }

  private async ensureDirs() {
    // ensure autocomplete cache dir
    await fs.ensureDir(this.autocompleteCacheDir);
    // ensure autocomplete completions dir
    await fs.ensureDir(this.completionsCacheDir);
  }

  private async createFiles() {
    await fs.writeFile(this.bashSetupScriptPath, this.bashSetupScript);
    await fs.writeFile(this.zshSetupScriptPath, this.zshSetupScript);
    await fs.writeFile(this.bashCommandsListPath, this.bashCommandsList);
    await fs.writeFile(this.zshCompletionSettersPath, this.zshCompletionSetters);
  }

  private get bashCommandsList(): string {
    return this.commands
      .map(c => {
        try {
          const publicFlags = this.genCmdPublicFlags(c).trim();
          return `${c.id} ${publicFlags}`;
        } catch (err) /* istanbul ignore next*/ {
          this.ux.error(`Error creating bash completion for command ${c.id}, moving on...`);
          this.ux.error(err.message);
          this.logger.error(err.message);
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
    const cmdsWithDescriptions = this.commands.map(c => {
      try {
        // tslint:disable-next-line: no-any
        return this.genCmdWithDescription(c as any);
      } catch (err) /* istanbul ignore next*/ {
        this.ux.error(`Error creating zsh autocomplete for command ${c.id}, moving on...`);
        this.ux.error(err.message);
        this.logger.error(err.message);
        return '';
      }
    });

    return this.genZshAllCmdsListSetter(cmdsWithDescriptions);
  }

  private genCmdWithDescription(command: Command): string {
    let description = '';
    if (command.description) {
      const text = command.description.split('\n')[0];
      description = `:"${text}"`;
    }
    return `"${command.id.replace(/:/g, '\\:')}"${description}`;
  }

  private get zshCommandsFlagsSetters(): string {
    return this.commands
      .map(c => {
        try {
          // tslint:disable-next-line: no-any
          return this.genZshCmdFlagsSetter(c as any);
        } catch (err) /* istanbul ignore next*/ {
          this.ux.error(`Error creating zsh autocomplete for command ${c.id}, moving on...`);
          this.ux.error(err.message);
          this.logger.error(err.message);
          return '';
        }
      })
      .join('\n');
  }

  private genZshCmdFlagsSetter(command: Command): string {
    const id = command.id;
    const flagscompletions = Object.keys(command.flags || {})
      .filter(flag => command.flags && !command.flags[flag].hidden)
      .map(flag => {
        // tslint:disable-next-line: no-any
        const f = (command.flags && command.flags[flag]) || ({ description: '' } as any);
        const isBoolean = f.type === 'boolean';
        const hasCompletion =
          f.hasOwnProperty('completion') || this.findCompletion(flag, id) || this.wantsLocalFiles(flag);
        const name = isBoolean ? flag : `${flag}=-`;
        let cachecompl = '';
        if (hasCompletion) {
          cachecompl = this.wantsLocalFiles(flag) ? ': :_files' : ': :_sfdx_compadd_flag_options';
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
    /* istanbul ignore next*/
    return `# no flags for ${id}`;
  }

  private genCmdPublicFlags(command: CommandCompletion): string {
    const cflags = command.flags /* istanbul ignore next*/ || {};
    return Object.keys(cflags)
      .filter(flag => !cflags[flag].hidden)
      .map(flag => `--${flag}`)
      .join(' ');
  }

  private genZshAllCmdsListSetter(cmdsWithDesc: string[]): string {
    return `
_sfdx_set_all_commands_list () {
_sfdx_all_commands_list=(
${cmdsWithDesc.join('\n')}
)
}
`;
  }
}
