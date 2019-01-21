#compdef sfdx

_sfdx () {
    local _sfdx_command_id=${words[2]}
    local _sfdx_cur=${words[CURRENT]}
    local -a _sfdx_flags=()
    
    ## all commands
    _sfdx_complete_commands () {
        local -a _sfdx_all_commands_list
        if type _sfdx_set_all_commands_list >/dev/null 2>&1; then
            echo "${words}" >> ~/sfdxcommands
            _sfdx_set_all_commands_list
            _describe -t all-commands "all commands" _sfdx_all_commands_list
            return
        fi
        echo "${words}" >> ~/sfdxcommands_fallback
        # fallback to grep'ing cmds from cache
        compadd $(grep -oe '^[a-zA-Z0-9:_-]\+' $SFDX_AC_COMMANDS_PATH)
    }
    ## end all commands
    
    _sfdx_compadd_args () {
        echo "${words}" >> ~/sfdxtrace
        compadd $(echo $([[ -n $REPORTTIME ]] && REPORTTIME=100; sfdx autocomplete:options "${words}"))
    }
    
    _sfdx_compadd_flag_options () {
        echo "${words}" >> ~/sfdxoptions
        _sfdx_compadd_args
    }
    
    if [ $CURRENT -gt 2 ]; then
        if [[ "$_sfdx_cur" == -* ]]; then
            echo "_sfdx_set_${_sfdx_command_id//:/_}_flags" >> ~/sfdxflag
            local _sfdx_flag_completion_func="_sfdx_set_${_sfdx_command_id//:/_}_flags"
            declare -f $_sfdx_flag_completion_func > /dev/null && $_sfdx_flag_completion_func || touch ~/sfdxerror
        else
            _sfdx_compadd_args
        fi
    fi
    
    _arguments -S '1: :_sfdx_complete_commands' \
    $_sfdx_flags
}

_sfdx