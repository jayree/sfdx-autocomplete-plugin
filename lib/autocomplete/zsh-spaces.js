/*
 * Copyright (c) 2022, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
/* eslint-disable no-underscore-dangle */
import * as util from 'node:util';
import { wantsLocalDirsArray, wantsLocalFilesArray } from './wantsLocal.js';
function sanitizeSummary(description) {
    if (description === undefined) {
        return '';
    }
    return (description
        .replace(/([`"])/g, '\\\\\\$1') // backticks and double-quotes require triple-backslashes
        // eslint-disable-next-line no-useless-escape
        .replace(/([\[\]])/g, '\\\\$1') // square brackets require double-backslashes
        .split('\n')[0]); // only use the first line
}
function wantsLocalFiles(flag) {
    return wantsLocalFilesArray.includes(flag);
}
function wantsLocalDirs(flag) {
    return wantsLocalDirsArray.includes(flag);
}
const argTemplate = '"%s")\n          %s\n        ;;';
export default class ZshCompWithSpaces {
    constructor(config) {
        this.config = config;
        this.topics = this.getTopics();
        this.commands = this.getCommands();
    }
    generate() {
        const firstArgs = [];
        this.topics.forEach((t) => {
            if (!t.name.includes(':'))
                firstArgs.push({
                    id: t.name,
                    summary: t.description,
                });
        });
        this.commands.forEach((c) => {
            if (!firstArgs.find((a) => a.id === c.id) && !c.id.includes(':'))
                firstArgs.push({
                    id: c.id,
                    summary: c.summary,
                });
        });
        const mainArgsCaseBlock = () => {
            let caseBlock = 'case $line[1] in\n';
            for (const arg of firstArgs) {
                if (this.coTopics.includes(arg.id)) {
                    // coTopics already have a completion function.
                    caseBlock += `        ${arg.id})\n          _${this.config.bin}_${arg.id}\n          ;;\n`;
                }
                else {
                    const cmd = this.commands.find((c) => c.id === arg.id);
                    if (cmd) {
                        // if it's a command and has flags, inline flag completion statement.
                        // skip it from the args statement if it doesn't accept any flag.
                        if (Object.keys(cmd.flags).length > 0) {
                            caseBlock += `        ${arg.id})\n          ${this.genZshFlagArgumentsBlock(cmd.flags)}         ;; \n`;
                        }
                    }
                    else {
                        // it's a topic, redirect to its completion function.
                        caseBlock += `        ${arg.id})\n          _${this.config.bin}_${arg.id}\n          ;;\n`;
                    }
                }
            }
            caseBlock += '      esac';
            return caseBlock;
        };
        const compFunc = `#compdef ${this.config.bin}

${this.topics.map((t) => this.genZshTopicCompFun(t.name)).join('\n')}

_${this.config.bin}() {
  local context state state_descr line
  typeset -A opt_args

  _arguments -C "1: :->cmds" "*::arg:->args"

  case "$state" in
    cmds)
      ${this.genZshValuesBlock(firstArgs)}
      ;;
    args)
      ${mainArgsCaseBlock()}
      ;;
  esac
}

_${this.config.bin}
`;
        return compFunc;
    }
    // eslint-disable-next-line class-methods-use-this
    genZshFlagArgumentsList(flags) {
        // if a command doesn't have flags make it only complete files
        // also add comp for the global `--help` flag.
        if (!flags)
            return '--help"[Show help for command]" "*: :_files';
        const flagNames = Object.keys(flags);
        // `-S`:
        // Do not complete flags after a ‘--’ appearing on the line, and ignore the ‘--’. For example, with -S, in the line:
        // foobar -x -- -y
        // the ‘-x’ is considered a flag, the ‘-y’ is considered an argument, and the ‘--’ is considered to be neither.
        let argumentsBlock = '';
        for (const flagName of flagNames) {
            const f = flags[flagName];
            // skip hidden flags
            if (f.hidden)
                continue;
            f.summary = sanitizeSummary(f.summary || f.description);
            let flagSpec = '';
            if (f.type === 'option') {
                if (f.char) {
                    if (f.multiple) {
                        // this flag can be present multiple times on the line
                        flagSpec += `"*"{-${f.char},--${f.name}}`;
                    }
                    else {
                        flagSpec += `{-${f.char},--${f.name}}`;
                    }
                    flagSpec += `"[${f.summary}]`;
                    if (f.options) {
                        flagSpec += `:${f.name} options:(${f.options?.join(' ')})"`;
                    }
                    else if (wantsLocalFiles(f.name)) {
                        flagSpec += ':file:_files"';
                    }
                    else if (wantsLocalDirs(f.name)) {
                        flagSpec += ':dir:_files -/"';
                    }
                    else {
                        flagSpec += '"';
                    }
                }
                else {
                    if (f.multiple) {
                        // this flag can be present multiple times on the line
                        flagSpec += '"*"';
                    }
                    flagSpec += `--${f.name}"[${f.summary}]:`;
                    if (f.options) {
                        flagSpec += `${f.name} options:(${f.options?.join(' ')})"`;
                    }
                    else if (wantsLocalFiles(f.name)) {
                        flagSpec += 'file:_files"';
                    }
                    else if (wantsLocalDirs(f.name)) {
                        flagSpec += 'dir:_files -"';
                    }
                    else {
                        flagSpec += '"';
                    }
                }
            }
            else if (f.char) {
                // Flag.Boolean
                flagSpec += `"(-${f.char} --${f.name})"{-${f.char},--${f.name}}"[${f.summary}]"`;
            }
            else {
                // Flag.Boolean
                flagSpec += `--${f.name}"[${f.summary}]"`;
            }
            flagSpec += ' \\\n';
            argumentsBlock += flagSpec;
        }
        // add global `--help` flag
        argumentsBlock += '--help"[Show help for command]"';
        // complete files if `-` is not present on the current line
        // argumentsBlock += '"*: :_files"';
        return argumentsBlock;
    }
    // eslint-disable-next-line class-methods-use-this
    genZshFlagArgumentsBlock(flags) {
        let argumentsBlock = '_arguments -S \\';
        const flagArgsBlockTemplate = '                     %s';
        this.genZshFlagArgumentsList(flags)
            .split('\n')
            .forEach((f) => {
            argumentsBlock += `\n${util.format(flagArgsBlockTemplate, f)}`;
        });
        return argumentsBlock;
    }
    // eslint-disable-next-line class-methods-use-this
    genZshValuesBlock(subArgs) {
        let valuesBlock = '_values "completions"';
        subArgs.forEach((subArg) => {
            valuesBlock += ` \\\n              "${subArg.id}[${subArg.summary}]"`;
        });
        return valuesBlock;
    }
    genZshTopicCompFun(id) {
        const coTopics = [];
        for (const topic of this.topics) {
            for (const cmd of this.commands) {
                if (topic.name === cmd.id) {
                    coTopics.push(topic.name);
                }
            }
        }
        const flagArgsTemplate = '"%s")\n          %s\n          ;;';
        const underscoreSepId = id.replace(/:/g, '_');
        const depth = id.split(':').length;
        const isCotopic = coTopics.includes(id);
        if (isCotopic) {
            const compFuncName = `${this.config.bin}_${underscoreSepId}`;
            const coTopicCompFunc = `_${compFuncName}() {
  local context state state_descr line
  typeset -A opt_args

  _arguments -C "1: :->cmds" "*::arg:->args"

  case "$state" in
    cmds)
      %s
      ;;
    args)
      case $line[1] in
        %s
      esac
      ;;
  esac
}
`;
            const subArgs = [];
            let argsBlock = '';
            this.topics
                .filter((t) => t.name.startsWith(id + ':') && t.name.split(':').length === depth + 1)
                .forEach((t) => {
                const subArg = t.name.split(':')[depth];
                subArgs.push({
                    id: subArg,
                    summary: t.description,
                });
                argsBlock += util.format(argTemplate, subArg, `_${this.config.bin}_${underscoreSepId}_${subArg}`);
            });
            this.commands
                .filter((c) => c.id.startsWith(id + ':') && c.id.split(':').length === depth + 1)
                .forEach((c) => {
                if (coTopics.includes(c.id))
                    return;
                const subArg = c.id.split(':')[depth];
                subArgs.push({
                    id: subArg,
                    summary: c.summary,
                });
                argsBlock += util.format(flagArgsTemplate, subArg, this.genZshFlagArgumentsBlock(c.flags));
            });
            let argumentsListBlock = '';
            const flagArgsBlockTemplate = '              %s';
            this.genZshFlagArgumentsList(this.commands.find((c) => c.id === id)?.flags)
                .split('\n')
                .forEach((f) => {
                argumentsListBlock += `\n${util.format(flagArgsBlockTemplate, f)}`;
            });
            return util.format(coTopicCompFunc, `${this.genZshValuesBlock(subArgs)} \\${argumentsListBlock}`, argsBlock);
        }
        let argsBlock = '';
        const subArgs = [];
        this.topics
            .filter((t) => t.name.startsWith(id + ':') && t.name.split(':').length === depth + 1)
            .forEach((t) => {
            const subArg = t.name.split(':')[depth];
            subArgs.push({
                id: subArg,
                summary: t.description,
            });
            argsBlock += util.format(argTemplate, subArg, `_${this.config.bin}_${underscoreSepId}_${subArg}`);
        });
        this.commands
            .filter((c) => c.id.startsWith(id + ':') && c.id.split(':').length === depth + 1)
            .forEach((c) => {
            if (coTopics.includes(c.id))
                return;
            const subArg = c.id.split(':')[depth];
            subArgs.push({
                id: subArg,
                summary: c.summary,
            });
            argsBlock += util.format(flagArgsTemplate, subArg, this.genZshFlagArgumentsBlock(c.flags));
        });
        const topicCompFunc = `_${this.config.bin}_${underscoreSepId}() {
  local context state state_descr line
  typeset -A opt_args

  _arguments -C "1: :->cmds" "*::arg:->args"

  case "$state" in
    cmds)
      %s
      ;;
    args)
      case $line[1] in
        %s
      esac
      ;;
  esac 
}
`;
        return util.format(topicCompFunc, this.genZshValuesBlock(subArgs), argsBlock);
    }
    // eslint-disable-next-line @typescript-eslint/member-ordering
    get coTopics() {
        if (this._coTopics)
            return this._coTopics;
        const coTopics = [];
        for (const topic of this.topics) {
            for (const cmd of this.commands) {
                if (topic.name === cmd.id) {
                    coTopics.push(topic.name);
                }
            }
        }
        this._coTopics = coTopics;
        return this._coTopics;
    }
    getTopics() {
        const topics = this.config.topics
            .filter((topic) => {
            // it is assumed a topic has a child if it has children
            const hasChild = this.config.topics.some((subTopic) => subTopic.name.includes(`${topic.name}:`));
            return hasChild;
        })
            .sort((a, b) => {
            if (a.name < b.name) {
                return -1;
            }
            if (a.name > b.name) {
                return 1;
            }
            return 0;
        })
            .map((t) => {
            const description = t.description ? sanitizeSummary(t.description) : `${t.name.replace(/:/g, ' ')} commands`;
            return {
                name: t.name,
                description,
            };
        });
        return topics;
    }
    getCommands() {
        const cmds = [];
        this.config.plugins.forEach((p) => {
            p.commands.forEach((c) => {
                if (c.hidden)
                    return;
                const summary = sanitizeSummary(c.summary || c.description);
                const flags = c.flags;
                cmds.push({
                    id: c.id,
                    summary,
                    flags,
                });
                c.aliases.forEach((a) => {
                    cmds.push({
                        id: a,
                        summary,
                        flags,
                    });
                    const split = a.split(':');
                    let topic = split[0];
                    // Completion funcs are generated from topics:
                    // `force` -> `force:org` -> `force:org:open|list`
                    //
                    // but aliases aren't guaranteed to follow the plugin command tree
                    // so we need to add any missing topic between the starting point and the alias.
                    for (let i = 0; i < split.length - 1; i++) {
                        if (!this.topics.find((t) => t.name === topic)) {
                            this.topics.push({
                                name: topic,
                                description: `${topic.replace(/:/g, ' ')} commands`,
                            });
                        }
                        topic += `:${split[i + 1]}`;
                    }
                });
            });
        });
        return cmds;
    }
}
//# sourceMappingURL=zsh-spaces.js.map