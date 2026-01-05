/*
 * Copyright 2026, jayree
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
const script = `#compdef <CLI_BIN>

_<CLI_BIN> () {
  # exit if vars are not set
  : "\${<CLI_BINENV>_AC_ANALYTICS_DIR?}"
  : "\${<CLI_BINENV>_AC_COMMANDS_PATH?}"

  local -a _flags=()
  local _command_id=\${words[2]}
  local _cur=\${words[CURRENT]}

  mkdir -p "$<CLI_BINENV>_AC_ANALYTICS_DIR"

  ## all commands
  _complete_commands () {
   touch "$<CLI_BINENV>_AC_ANALYTICS_DIR"/command
   local -a _all_commands_list
   if type _<CLI_BIN>_set_all_commands_list >/dev/null 2>&1; then
     _<CLI_BIN>_set_all_commands_list
     _describe -t all-commands "all commands" _all_commands_list
     return
   fi
   # fallback to grep'ing cmds from cache
   compadd $(grep -oe '^[a-zA-Z0-9:_-]\\+' $<CLI_BINENV>$SFDX_AC_COMMANDS_PATH"_setters")
  }
  ## end all commands

  _compadd_args () {
    compadd $(echo $([[ -n $REPORTTIME ]] && REPORTTIME=100; <CLI_BIN> autocmplt:options "\${words}"))
  }

  _compadd_flag_options () {
    touch "$<CLI_BINENV>_AC_ANALYTICS_DIR"/value
    _compadd_args
  }

  if [ $CURRENT -gt 2 ]; then
    if [[ "$_cur" == -* ]]; then
      touch "$<CLI_BINENV>_AC_ANALYTICS_DIR"/flag
      local _flag_completion_func="_set_\${_command_id//:/_}_flags"
      declare -f $_flag_completion_func >/dev/null && $_flag_completion_func
    else
      if type _compadd_args >/dev/null 2>&1; then
        _compadd_args
      fi
    fi
  fi

  _arguments  '1: :_complete_commands' \
              $_flags
}

_<CLI_BIN>`;

export default script;
