import { Config } from '@oclif/config';
import { expect, test } from '@salesforce/command/lib/test';
import * as path from 'path';

import Create from '../../../src/commands/autocomplete/create';

const root = path.resolve(__dirname, '../../../package.json');
const config = new Config({ root });

// autocomplete will throw error on windows ci
const skipwindows = process.platform === 'win32' ? describe.skip : describe;

skipwindows('autocompleteCreate', () => {
  // tslint:disable-next-line: no-any
  let cmd: any;
  before(async () => {
    if (process.platform === 'win32') this.skip();
    await config.load();
    global.config = new Config(config);
    global.config.cacheDir = path.join(__dirname, '../../../../test/assets/cache');
    global.config.bin = 'sfdx';
    cmd = new Create([], config);
    // tslint:disable-next-line: no-any
    cmd['logger'] = { error: () => {}, info: () => {}, warn: () => {} } as any;
    await cmd.run();
  });

  test.it('file paths', () => {
    const dir = global.config.cacheDir;
    expect(cmd.bashSetupScriptPath).to.eq(`${dir}/autocomplete/bash_setup`);
    expect(cmd.bashCompletionFunctionPath).to.eq(`${dir}/autocomplete/functions/bash/sfdx.bash`);
    expect(cmd.zshSetupScriptPath).to.eq(`${dir}/autocomplete/zsh_setup`);
    expect(cmd.zshCompletionFunctionPath).to.eq(`${dir}/autocomplete/functions/zsh/_sfdx`);
  });

  test.it('#bashSetupScript', () => {
    expect(cmd.bashSetupScript).to.eq(
      `SFDX_AC_BASH_COMPFUNC_PATH=${
        global.config.cacheDir
      }/autocomplete/functions/bash/sfdx.bash && test -f $SFDX_AC_BASH_COMPFUNC_PATH && source $SFDX_AC_BASH_COMPFUNC_PATH;\n`
    );
  });

  test.it('#zshSetupScript', () => {
    expect(cmd.zshSetupScript).to.eq(`
fpath=(
${global.config.cacheDir}/autocomplete/functions/zsh
$fpath
);
autoload -Uz compinit;
compinit;
`);
  });

  test.it('#bashCompletionFunction', () => {
    expect(cmd.bashCompletionFunction).to.eq(`#!/usr/bin/env bash

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

_sfdx()
{

  local cur="\${COMP_WORDS[COMP_CWORD]}" opts IFS=$' \\t\\n'
  COMPREPLY=()

  local commands="
autocomplete --json --loglevel --refresh-cache
cachedcommand:test --json --loglevel
"

  if [[ "\${COMP_CWORD}" -eq 1 ]] ; then
      opts=$(printf "$commands" | grep -Eo '^[a-zA-Z0-9:_-]+')
      COMPREPLY=( $(compgen -W "\${opts}" -- \${cur}) )
       __ltrim_colon_completions "$cur"
  else
      if [[ $cur == "-"* ]] ; then
        opts=$(printf "$commands" | grep "\${COMP_WORDS[1]}" | sed -n "s/^\${COMP_WORDS[1]} //p")
        COMPREPLY=( $(compgen -W  "\${opts}" -- \${cur}) )
      fi
  fi
  return 0
}

complete -F _sfdx sfdx\n`);
  });

  test.it('#zshCompletionFunction', () => {
    expect(cmd.zshCompletionFunction).to.eq(`#compdef sfdx

_sfdx () {
  local _command_id=\${words[2]}
  local _cur=\${words[CURRENT]}
  local -a _command_flags=()

  ## public cli commands & flags
  local -a _all_commands=(
"autocomplete:display autocomplete installation instructions"
"cachedcommand\\:test:"
  )

  _set_flags () {
    case $_command_id in
autocomplete)
  _command_flags=(
    "--json[format output as json]"
"--loglevel=-[logging level for this command invocation]:"
"--refresh-cache[Refresh cache (ignores displaying instructions)]"
  )
;;

cachedcommand:test)
  _command_flags=(
    "--json[format output as json]"
"--loglevel=-[logging level for this command invocation]:"
  )
;;

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

_sfdx\n`);
  });
});
