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

  private get bashFunctionsDir(): string {
    // <cachedir>/autocomplete/functions/bash
    return path.join(this.autocompleteCacheDir, 'functions', 'bash');
  }

  private get zshFunctionsDir(): string {
    // <cachedir>/autocomplete/functions/zsh
    return path.join(this.autocompleteCacheDir, 'functions', 'zsh');
  }

  private get bashCompletionFunctionPath(): string {
    // <cachedir>/autocomplete/functions/bash/<bin>.bash
    return path.join(this.bashFunctionsDir, `${this.cliBin}.bash`);
  }

  private get zshCompletionFunctionPath(): string {
    // <cachedir>/autocomplete/functions/zsh/_<bin>
    return path.join(this.zshFunctionsDir, `_${this.cliBin}`);
  }

  private get bashSetupScript(): string {
    const setup = path.join(this.bashFunctionsDir, `${this.cliBin}.bash`);
    const bin = this.cliBinEnvVar;
    return `${bin}_AC_BASH_COMPFUNC_PATH=${setup} && test -f \$${bin}_AC_BASH_COMPFUNC_PATH && source \$${bin}_AC_BASH_COMPFUNC_PATH;
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
${this.envCommandsPath}
SFDX_AC_ZSH_SETTERS_PATH=\${SFDX_AC_COMMANDS_PATH}_setters && test -f $SFDX_AC_ZSH_SETTERS_PATH && source $SFDX_AC_ZSH_SETTERS_PATH;
fpath=(
${this.zshFunctionsDir}
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

  private get genAllCommandsMetaString(): string {
    return this.commands
      .map(c => {
        return `\"${c.id.replace(/:/g, '\\:')}:${c.description}\"`;
      })
      .join('\n');
  }

  private get genCaseStatementForFlagsMetaString(): string {
    // command)
    //   _command_flags=(
    //   "--boolean[bool descr]"
    //   "--value=-[value descr]:"
    //   )
    // ;;
    return this.commands
      .map(c => {
        return `${c.id})
  _sfdx_flags=(
    ${this.genZshFlagSpecs(c)}
  )
;;\n`;
      })
      .join('\n');
  }

  private get bashCommandsWithFlagsList(): string {
    return this.commands
      .map(c => {
        const publicFlags = this.genCmdPublicFlags(c).trim();
        return `${c.id} ${publicFlags}`;
      })
      .join('\n');
  }

  private get bashCompletionFunction(): string {
    const cliBin = this.cliBin;

    return `#!/usr/bin/env bash

if ! type __ltrim_colon_completions >/dev/null 2>&1; then
  #   Copyright © 2006-2008, Ian Macdonald <ian@caliban.org>
  #             © 2009-2017, Bash Completion Maintainers
  __ltrim_colon_completions() {
      # If word-to-complete contains a colon,
      # and bash-version < 4,
      # or bash-version >= 4 and COMP_WORDBREAKS contains a colon
      if [[
          "$1" == *:* && (
              \${BASH_VERSINFO[0]} -lt 4 ||
              (\${BASH_VERSINFO[0]} -ge 4 && "$COMP_WORDBREAKS" == *:*)
          )
      ]]; then
          # Remove colon-word prefix from COMPREPLY items
          local colon_word=\${1%\${1##*:}}
          local i=\${#COMPREPLY[*]}
          while [ $((--i)) -ge 0 ]; do
              COMPREPLY[$i]=\${COMPREPLY[$i]#"$colon_word"}
          done
      fi
  }
fi

_${cliBin}_compreply_cli () {
  opts=("$(${cliBin} autocomplete:options "$(echo "\${COMP_WORDS[*]}")")")
  COMPREPLY=( $(compgen -W "\${opts}" -- \${cur}) )
}

_${cliBin}()
{

  local cur="\${COMP_WORDS[COMP_CWORD]}" opts IFS=$' \\t\\n'
  COMPREPLY=()

  local commands="
${this.bashCommandsWithFlagsList}
"

  if [[ "\${COMP_CWORD}" -eq 1 ]] ; then
      opts=$(printf "$commands" | grep -Eo '^[a-zA-Z0-9:_-]+')
      COMPREPLY=( $(compgen -W "\${opts}" -- \${cur}) )
       __ltrim_colon_completions "$cur"
  else
      if [[ $cur == "-"* ]] ; then
        opts=$(printf "$commands" | grep "\${COMP_WORDS[1]}" | sed -n "s/^\${COMP_WORDS[1]} //p")
        COMPREPLY=( $(compgen -W  "\${opts}" -- \${cur}) )
                else
          _${cliBin}_compreply_cli
      fi
  fi
  return 0
}

complete -F _${cliBin} ${cliBin}
`;
  }

  private get zshCompletionFunction(): string {
    const cliBin = this.cliBin;
    const allCommandsMeta = this.genAllCommandsMetaString;
    const caseStatementForFlagsMeta = this.genCaseStatementForFlagsMetaString;

    return `#compdef ${cliBin}

_${cliBin} () {
  local _sfdx_command_id=\${words[2]}
  local _sfdx_cur=\${words[CURRENT]}
  local -a _sfdx_flags=()

  ## public cli commands & flags
  local -a _all_commands=(
${allCommandsMeta}
  )

  _set_flags () {
    case $_sfdx_command_id in
${caseStatementForFlagsMeta}
    esac
  }
  ## end public cli commands & flags

  ## all commands
  _sfdx_complete_commands () {
   local -a _sfdx_all_commands_list
   if type _sfdx_set_all_commands_list >/dev/null 2>&1; then
    echo "\${words}" >> ~/sfdxcommands
     _sfdx_set_all_commands_list
     _describe -t all-commands "all commands" _sfdx_all_commands_list
     return
   fi
   echo "\${words}" >> ~/sfdxcommands_fallback
   # fallback to grep'ing cmds from cache
   compadd $(grep -oe '^[a-zA-Z0-9:_-]\+' $SFDX_AC_COMMANDS_PATH)
  }
  ## end all commands

    _sfdx_compadd_args () {
      echo "\${words}" >> ~/sfdxtrace
    compadd $(echo $([[ -n $REPORTTIME ]] && REPORTTIME=100; ${cliBin} autocomplete:options "\${words}"))
  }

  _sfdx_compadd_flag_options () {
    echo "\${words}" >> ~/sfdxoptions
    _sfdx_compadd_args
  }

  if [ $CURRENT -gt 2 ]; then
    if [[ "$_sfdx_cur" == -* ]]; then
      echo "_sfdx_set_\${_sfdx_command_id//:/_}_flags" >> ~/sfdxflag
      local _sfdx_flag_completion_func="_sfdx_set_\${_sfdx_command_id//:/_}_flags"
      declare -f $_sfdx_flag_completion_func > /dev/null && $_sfdx_flag_completion_func || touch ~/sfdxerror
    else
        _sfdx_compadd_args
    fi
  fi


  _arguments -S '1: :_sfdx_complete_commands' \\
                $_sfdx_flags
}

_${cliBin}
`;
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
    // ensure autocomplete bash function dir
    await fs.ensureDir(this.bashFunctionsDir);
    // ensure autocomplete zsh function dir
    await fs.ensureDir(this.zshFunctionsDir);
  }

  private async createFiles() {
    await fs.writeFile(this.bashSetupScriptPath, this.bashSetupScript);
    await fs.writeFile(this.bashCompletionFunctionPath, this.bashCompletionFunction);
    await fs.writeFile(this.bashCommandsListPath, this.bashCommandsList);
    await fs.writeFile(this.zshSetupScriptPath, this.zshSetupScript);
    await fs.writeFile(this.zshCompletionFunctionPath, this.zshCompletionFunction);
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

  private genZshFlagSpecs(klass: CommandCompletion): string {
    return Object.keys(klass.flags /* istanbul ignore next*/ || {})
      .filter(flag => klass.flags && !klass.flags[flag].hidden)
      .map(flag => {
        const f = (klass.flags && klass.flags[flag]) /* istanbul ignore next*/ || { description: '' };
        const isBoolean = f.type === 'boolean';
        const name = isBoolean ? flag : `${flag}=-`;
        const valueCmpl = isBoolean ? '' : ':';
        const completion = `--${name}[${f.description}]${valueCmpl}`;
        return `"${completion}"`;
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
      } catch (err) {
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
        } catch (err) {
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
        const hasCompletion = f.hasOwnProperty('completion') || this.findCompletion(flag, id);
        const name = isBoolean ? flag : `${flag}=-`;
        let cachecompl = '';
        if (hasCompletion) {
          // tslint:disable-next-line: no-any
          cachecompl = (this.wantsLocalFiles(flag) as any) ? ':_files' : ': :_sfdx_compadd_flag_options';
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

  private wantsLocalFiles(flag: string) {
    ['file', 'procfile'].includes(flag);
  }
}
