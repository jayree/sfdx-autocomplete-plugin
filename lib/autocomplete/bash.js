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
const script = `#!/usr/bin/env bash

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

_compreply_cli () {
  opts=("$(<CLI_BIN> autocmplt:options "$(echo "\${COMP_WORDS[*]}")")")
  COMPREPLY=( $(compgen -W "\${opts}" -- \${cur}) )
}

_<CLI_BIN>()
{
    # print error and exit if vars are not set
    : "\${<CLI_BINENV>_AC_ANALYTICS_DIR?}"
    : "\${<CLI_BINENV>_AC_COMMANDS_PATH?}"

    local cur="\${COMP_WORDS[COMP_CWORD]}" opts IFS=$' \t\n'
    COMPREPLY=()
    mkdir -p "$<CLI_BINENV>_AC_ANALYTICS_DIR"

    if [[ "\${COMP_CWORD}" -eq 1 ]] ; then
        touch "$<CLI_BINENV>_AC_ANALYTICS_DIR"/command
        opts=$(grep -oe '^[a-zA-Z0-9:_-]\\+' $<CLI_BINENV>_AC_COMMANDS_PATH)
        COMPREPLY=( $(compgen -W "\${opts}" -- $\{cur}) )
         __ltrim_colon_completions "$cur"
    else
        if [[ $cur == "-"* ]] ; then
          touch "$<CLI_BINENV>_AC_ANALYTICS_DIR"/flag
          opts=$(grep "\${COMP_WORDS[1]}" $<CLI_BINENV>_AC_COMMANDS_PATH | sed -n "s/^\${COMP_WORDS[1]} //p")
          COMPREPLY=( $(compgen -W  "\${opts}" -- \${cur}) )
        else
          touch "$<CLI_BINENV>_AC_ANALYTICS_DIR"/value
          _compreply_cli
        fi
    fi
    return 0
}

complete -F _<CLI_BIN> <CLI_BIN>`;
export default script;
//# sourceMappingURL=bash.js.map