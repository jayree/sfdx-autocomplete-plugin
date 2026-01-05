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
/* eslint-disable no-underscore-dangle */
import util from 'node:util';
import { CompletionLookup } from '../completions.js';
import { wantsLocalDirsArray, wantsLocalFilesArray } from './wantsLocal.js';
function isSanitized(description) {
    const backtickAndDoubleQuoteRegex = /[^\\]([`"])/;
    const squareBracketRegex = /[^\\]([[\]])/;
    return !backtickAndDoubleQuoteRegex.test(description) && !squareBracketRegex.test(description);
}
function sanitizeSummary(description) {
    if (description === undefined) {
        return '';
    }
    if (isSanitized(description)) {
        return description.split('\n')[0]; // only use the first line
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
    config;
    topics;
    commands;
    coTopics;
    constructor(config) {
        this.config = config;
        this.topics = this.getTopics();
        this.commands = this.getCommands();
        this.coTopics = this.getCoTopics();
    }
    async generate(bin) {
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
            let caseBlock = '';
            for await (const arg of firstArgs) {
                if (this.coTopics.includes(arg.id)) {
                    // coTopics already have a completion function.
                    caseBlock += `\n        ${arg.id})\n          _arguments -C "*::arg:->args"\n          _${bin}_${arg.id}\n          ;;`;
                }
                else {
                    const cmd = this.commands.find((c) => c.id === arg.id);
                    if (cmd) {
                        // if it's a command and has flags, inline flag completion statement.
                        // skip it from the args statement if it doesn't accept any flag.
                        if (Object.keys(cmd.flags).length > 0) {
                            caseBlock += `\n        ${arg.id})\n          _arguments -C "*::arg:->args"\n          ${await this.genZshFlagArgumentsBlock(cmd.flags)}         ;;`;
                        }
                    }
                    else {
                        // it's a topic, redirect to its completion function.
                        caseBlock += `\n        ${arg.id})\n          _arguments -C "*::arg:->args"\n          _${bin}_${arg.id}\n          ;;`;
                    }
                }
            }
            return caseBlock;
        };
        let flags = '\n    --help"[Show help]" \\';
        flags += '\n    --version"[Show version]"\n  ';
        let zshTopicsComp = '';
        for await (const t of this.topics) {
            zshTopicsComp += `\n${await this.genZshTopicCompFun(bin, t.name)}`;
        }
        const compFunc = `#compdef ${bin}
${zshTopicsComp}
_${bin}() {
  local context state state_descr line
  typeset -A opt_args

  local -a flags=(%s)

  _arguments -C "1: :->cmds" "*: :->args"

  case "$state" in
    cmds)
      %s \\
              "\${flags[@]}"
      ;;
    args)
      case $line[1] in%s
        *)
          _arguments -S \\
                     "\${flags[@]}"
          ;;
      esac
      ;;
  esac
}

_${bin}
`;
        return util.format(compFunc, flags, this.genZshValuesBlock(firstArgs), await mainArgsCaseBlock());
    }
    // eslint-disable-next-line class-methods-use-this
    async genZshFlagArguments(flags) {
        const flagNames = Object.keys(flags ?? {});
        const argumentsArray = [];
        for await (const flagName of flagNames) {
            const f = flags?.[flagName];
            // skip hidden flags
            if (f.hidden)
                continue;
            f.summary = sanitizeSummary(f.summary ?? f.description);
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
                const cacheCompletion = new CompletionLookup(f.name, ' ').run();
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
            flagSpec += ' \\';
            argumentsArray.push(flagSpec);
        }
        // add global `--help` flag
        argumentsArray.push('--help"[Show help for command]"');
        return argumentsArray;
    }
    async genZshFlagArgumentsBlock(flags) {
        // `-S`:
        // Do not complete flags after a ‘--’ appearing on the line, and ignore the ‘--’. For example, with -S, in the line:
        // foobar -x -- -y
        // the ‘-x’ is considered a flag, the ‘-y’ is considered an argument, and the ‘--’ is considered to be neither.
        let argumentsBlock = '_arguments -S \\';
        (await this.genZshFlagArguments(flags)).forEach((f) => {
            argumentsBlock += `\n                     ${f}`;
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
    async genZshTopicCompFun(bin, id) {
        const underscoreSepId = id.replace(/:/g, '_');
        const depth = id.split(':').length;
        let flags = '';
        const cflags = this.commands.find((c) => c.id === id)?.flags;
        (await this.genZshFlagArguments(cflags)).forEach((f) => {
            flags += `\n    ${f}`;
        });
        flags += '\n  ';
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
            argsBlock += util.format('\n        "%s")\n          _arguments -C "*::arg:->args"\n          %s\n        ;;', subArg, `_${bin}_${underscoreSepId}_${subArg}`);
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
                argsBlock += util.format('\n        "%s")\n          _arguments -C "*::arg:->args"\n          %s\n          ;;', subArg, block);
            }
        }
        const topicCompFunc = `_${bin}_${underscoreSepId}() {
  local context state state_descr line
  typeset -A opt_args

  local -a flags=(%s)

  _arguments -C "1: :->cmds" "*: :->args"

  case "$state" in
    cmds)
      %s \\
              "\${flags[@]}"
      ;;
    args)
      case $line[1] in%s
        *)
          _arguments -S \\
                     "\${flags[@]}"
          ;;
      esac
      ;;
  esac
}
`;
        return util.format(topicCompFunc, flags, this.genZshValuesBlock(subArgs), argsBlock);
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
        this.config.getPluginsList().forEach((p) => {
            p.commands.forEach((c) => {
                if (c.hidden)
                    return;
                const summary = sanitizeSummary(c.summary ?? c.description);
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