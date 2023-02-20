/*
 * Copyright (c) 2022, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import util from 'node:util';
import { CompletionLookup } from '../completions.js';
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
export default class ZshCompWithSpaces {
    constructor(config) {
        this.config = config;
        this.topics = this.getTopics();
        this.commands = this.getCommands();
        this.coTopics = this.getCoTopics();
    }
    async generate() {
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
        const mainArgsCaseBlock = async () => {
            let caseBlock = 'case $line[1] in\n';
            for await (const arg of firstArgs) {
                if (this.coTopics?.includes(arg.id)) {
                    // coTopics already have a completion function.
                    caseBlock += `        ${arg.id})\n          _${this.config.bin}_${arg.id}\n          ;;\n`;
                }
                else {
                    const cmd = this.commands.find((c) => c.id === arg.id);
                    if (cmd) {
                        // if it's a command and has flags, inline flag completion statement.
                        // skip it from the args statement if it doesn't accept any flag.
                        if (Object.keys(cmd.flags).length > 0) {
                            caseBlock += `        ${arg.id})\n          ${await this.genZshFlagArgumentsBlock(cmd.flags)}         ;; \n`;
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
        let zshTopicsComp = '';
        for await (const t of this.topics) {
            zshTopicsComp += `\n${await this.genZshTopicCompFun(t.name)}`;
        }
        const compFunc = `#compdef ${this.config.bin}
${zshTopicsComp}
_${this.config.bin}() {
  local context state state_descr line
  typeset -A opt_args

  _arguments -C "1: :->cmds" "*::arg:->args"

  case "$state" in
    cmds)
      ${await this.genZshValuesBlock({ subArgs: firstArgs })}
      ;;
    args)
      ${await mainArgsCaseBlock()}
      ;;
  esac
}

_${this.config.bin}
`;
        return compFunc;
    }
    // eslint-disable-next-line class-methods-use-this
    async genZshFlagArguments(flags) {
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
        for await (const flagName of flagNames) {
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
                        flagSpec += `"(-${f.char} --${f.name})"{-${f.char},--${f.name}}`;
                    }
                }
                else if (f.multiple) {
                    // this flag can be present multiple times on the line
                    flagSpec += `"*"--${f.name}`;
                }
                else {
                    flagSpec += `--${f.name}`;
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
            if (f.type === 'option') {
                flagSpec += `"[${f.summary}]`;
                let options = f.options;
                const cacheCompletion = new CompletionLookup(f.name).run();
                if (cacheCompletion) {
                    options = await cacheCompletion.options();
                }
                if (options) {
                    flagSpec += `:${f.name} options:(${options?.join(' ')})"`;
                }
                else if (wantsLocalFiles(f.name)) {
                    flagSpec += ':file:_files"';
                }
                else if (wantsLocalDirs(f.name)) {
                    flagSpec += ':dir:_files -/"';
                }
                else {
                    flagSpec += ':"';
                }
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
    async genZshFlagArgumentsBlock(flags) {
        let argumentsBlock = '_arguments -S \\';
        (await this.genZshFlagArguments(flags)).split('\n').forEach((f) => {
            argumentsBlock += `\n                     ${f}`;
        });
        return argumentsBlock;
    }
    // eslint-disable-next-line class-methods-use-this
    async genZshValuesBlock(options) {
        let valuesBlock = '_values "completions"';
        const { id, subArgs } = options;
        subArgs.forEach((subArg) => {
            valuesBlock += ` \\\n              "${subArg.id}[${subArg.summary}]"`;
        });
        if (id) {
            const cflags = this.commands.find((c) => c.id === id)?.flags;
            if (cflags) {
                valuesBlock += ' \\';
                (await this.genZshFlagArguments(cflags)).split('\n').forEach((f) => {
                    valuesBlock += `\n              ${f}`;
                });
            }
        }
        return valuesBlock;
    }
    async genZshTopicCompFun(id) {
        const underscoreSepId = id.replace(/:/g, '_');
        const depth = id.split(':').length;
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
            argsBlock += util.format('"%s")\n          %s\n        ;;', subArg, `_${this.config.bin}_${underscoreSepId}_${subArg}`);
        });
        for await (const c of this.commands.filter(
        // eslint-disable-next-line @typescript-eslint/no-shadow
        (c) => c.id.startsWith(id + ':') && c.id.split(':').length === depth + 1)) {
            if (!this.coTopics?.includes(c.id)) {
                const subArg = c.id.split(':')[depth];
                subArgs.push({
                    id: subArg,
                    summary: c.summary,
                });
                const block = await this.genZshFlagArgumentsBlock(c.flags);
                argsBlock += util.format('"%s")\n          %s\n          ;;', subArg, block);
            }
        }
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
        return util.format(topicCompFunc, await this.genZshValuesBlock({ id, subArgs }), argsBlock);
    }
    // eslint-disable-next-line @typescript-eslint/member-ordering
    getCoTopics() {
        const coTopics = [];
        for (const topic of this.topics) {
            for (const cmd of this.commands) {
                if (topic.name === cmd.id) {
                    coTopics.push(topic.name);
                }
            }
        }
        return coTopics;
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