import { Plugin } from '@oclif/config';
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

  private get zshSetupScript(): string {
    return `
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
  _command_flags=(
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
  local _command_id=\${words[2]}
  local _cur=\${words[CURRENT]}
  local -a _command_flags=()

  ## public cli commands & flags
  local -a _all_commands=(
${allCommandsMeta}
  )

  _set_flags () {
    case $_command_id in
${caseStatementForFlagsMeta}
    esac
  }
  ## end public cli commands & flags

  _complete_commands () {
    _describe -t all-commands "all commands" _all_commands
  }

  if [ $CURRENT -gt 2 ]; then
    if [[ "$_cur" == -* ]]; then
      _set_flags
    fi
  fi


  _arguments -S '1: :_complete_commands' \\
                $_command_flags
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

  private async ensureCommands() {
    const cache = JSON.parse(await fs.readFile(path.resolve(this.sfdxCacheDir, 'plugins.json'), 'utf8')).plugins;
    this.config.plugins = [];

    for (const pluginDir of Object.keys(cache)) {
      const root = path.resolve(pluginDir, 'package.json');
      try {
        const pjson = JSON.parse(await fs.readFile(root, 'utf8'));
        if (pjson.files) {
          const plugin = new Plugin({ root });
          await plugin.load();
          this.logger.info('plugin loaded: ' + root);
          this.config.plugins.push(plugin);
        } else {
          this.logger.warn('plugin not vaild: ' + root);
          this.config.plugins.push(cache[pluginDir]);
        }
      } catch (err) {
        /* istanbul ignore else*/
        if (err.code === 'ENOENT') {
          this.logger.warn('File not found: ' + root);
          this.config.plugins.push(cache[pluginDir]);
        } else {
          this.logger.error(err.message);
          throw err;
        }
      }
    }
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
    // await fs.writeFile(this.zshCompletionSettersPath, this.zshCompletionSetters)
  }

  private get bashCommandsList(): string {
    return this.commands
      .map(c => {
        try {
          const publicFlags = this.genCmdPublicFlags(c).trim();
          return `${c.id} ${publicFlags}`;
        } catch (err) {
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

  private genCmdPublicFlags(command: CommandCompletion): string {
    const cflags = command.flags /* istanbul ignore next*/ || {};
    return Object.keys(cflags)
      .filter(flag => !cflags[flag].hidden)
      .map(flag => `--${flag}`)
      .join(' ');
  }
}
