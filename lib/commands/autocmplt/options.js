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
// eslint-disable-next-line sf-plugin/no-oclif-flags-command-import
import { Args } from '@oclif/core';
import { AutocompleteBase } from '../../base.js';
export default class Options extends AutocompleteBase {
    static aliases = ['autocomplete:options'];
    static hidden = true;
    static description = 'display arg or flag completion options (used internally by completion fuctions)';
    /*   public static flags = {
      app: flags.app({ required: false, hidden: true })
    }; */
    static args = {
        completion: Args.string({ strict: false }),
    };
    // helpful dictionary
    //
    // *args: refers to a Command's static args
    // *argv: refers to the current execution's command line positional input
    // Klass: (class) Command class
    // completion: (object) object with data/methods to build/retrive options from cache
    // curPosition*: the current argv position the shell is trying to complete
    // options: (string) white-space seperated list of values for the shell to use for completion
    async run() {
        this.errorIfWindows();
        // ex: heroku autocomplete:options 'heroku addons:destroy -a myapp myaddon'
        try {
            const commandStateVars = (await this.processCommandLine());
            const completion = this.determineCompletion(commandStateVars);
            const options = await this.fetchOptions(completion);
            if (options)
                this.log(options);
        }
        catch (err) {
            // write to ac log
            this.writeLogFile(err.message);
        }
    }
    // eslint-disable-next-line class-methods-use-this
    findFlagFromWildArg(wild, klass) {
        let name = wild.replace(/^-+/, '');
        name = name.replace(/=(.+)?$/, '');
        if (!klass.flags)
            return {};
        const cFlags = klass.flags;
        let flag = cFlags[name];
        if (flag)
            return { name, flag };
        name = Object.keys(cFlags).find((k) => cFlags[k].char === name) ?? 'undefinedcommand';
        flag = cFlags?.[name];
        if (flag)
            return { name, flag };
        return {};
    }
    determineCmdState(argv, klass) {
        const args = klass.args || {};
        let needFlagValueSatisfied = false;
        let argIsFlag = false;
        let argIsFlagValue = false;
        let argsIndex = -1;
        let flagName;
        argv.filter((wild) => {
            // eslint-disable-next-line @typescript-eslint/prefer-regexp-exec
            if (wild.match(/^-(-)?/)) {
                // we're a flag
                argIsFlag = true;
                // ignore me
                const wildSplit = wild.split('=');
                const key = wildSplit.length === 1 ? wild : wildSplit[0];
                const { name, flag } = this.findFlagFromWildArg(key, klass);
                flagName = name;
                // end ignore me
                if (wildSplit.length === 1) {
                    // we're a flag w/o a '=value'
                    // (find flag & see if flag needs a value)
                    if (flag && flag.type !== 'boolean') {
                        // we're a flag who needs our value to be next
                        argIsFlagValue = false;
                        needFlagValueSatisfied = true;
                        return false;
                    }
                }
                // --app=my-app is consided a flag & not a flag value
                // the shell's autocomplete handles partial value matching
                // add parsedFlag
                if (wildSplit.length === 2 && name) {
                    this.parsedFlags[name] = wildSplit[1];
                }
                // we're a flag who is satisfied
                argIsFlagValue = false;
                needFlagValueSatisfied = false;
                return false;
            }
            // we're not a flag
            argIsFlag = false;
            if (needFlagValueSatisfied) {
                // we're a flag value
                // add parsedFlag
                if (flagName)
                    this.parsedFlags[flagName] = wild;
                argIsFlagValue = true;
                needFlagValueSatisfied = false;
                return false;
            }
            // we're an arg!
            // add parsedArgs
            // TO-DO: how to handle variableArgs?
            argsIndex += 1;
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            if (argsIndex < Object.keys(args).length) {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
                this.parsedArgs[Object.keys(args)[argsIndex]] = wild;
            }
            argIsFlagValue = false;
            needFlagValueSatisfied = false;
            return true;
        });
        return [argsIndex, argIsFlag, argIsFlagValue];
    }
    async processCommandLine() {
        // find command id
        const commandLineToComplete = this.argv[0].split(' ');
        const id = commandLineToComplete[1];
        // find Command
        const C = this.config.findCommand(id);
        let klass;
        if (C) {
            klass = await C.load();
            // process Command state from command line data
            const slicedArgv = commandLineToComplete.slice(2);
            const [argsIndex, curPositionIsFlag, curPositionIsFlagValue] = this.determineCmdState(slicedArgv, klass);
            return {
                id,
                klass,
                argsIndex,
                curPositionIsFlag,
                curPositionIsFlagValue,
                slicedArgv,
            };
        }
        else {
            this.throwError(`Command ${id} not found`);
        }
    }
    determineCompletion(commandStateVars) {
        const { id, klass, argsIndex, curPositionIsFlag, curPositionIsFlagValue, slicedArgv } = commandStateVars;
        // setup empty cache completion vars to assign
        let cacheKey;
        let cacheCompletion;
        // completing a flag/value? else completing an arg
        if (curPositionIsFlag || curPositionIsFlagValue) {
            const slicedArgvCount = slicedArgv.length;
            const lastArgvArg = slicedArgv[slicedArgvCount - 1];
            const previousArgvArg = slicedArgv[slicedArgvCount - 2];
            const argvFlag = curPositionIsFlagValue ? previousArgvArg : lastArgvArg;
            const { name, flag } = this.findFlagFromWildArg(argvFlag, klass);
            if (!flag)
                this.throwError(`${argvFlag} is not a valid flag for ${id}`);
            cacheKey = name || flag.name;
            if (flag.type === 'option' && flag.options) {
                cacheCompletion = {
                    skipCache: true,
                    // eslint-disable-next-line @typescript-eslint/require-await
                    options: async () => flag.options,
                };
            }
        }
        else {
            const cmdArgs = klass.args || {};
            // variable arg (strict: false)
            if (!klass.strict) {
                cacheKey = cmdArgs[0]?.name.toLowerCase();
                cacheCompletion = this.findCompletion(cacheKey);
                if (!cacheCompletion) {
                    this.throwError(`Cannot complete variable arg position for ${id}`);
                }
            }
            else if (argsIndex > Object.keys(cmdArgs).length - 1) {
                this.throwError(`Cannot complete arg position ${argsIndex} for ${id}`);
            }
            else {
                const arg = cmdArgs[argsIndex];
                cacheKey = arg.name.toLowerCase();
            }
        }
        // try to auto-populate the completion object
        if (!cacheCompletion) {
            cacheCompletion = this.findCompletion(cacheKey);
        }
        return { cacheKey, cacheCompletion };
    }
    // eslint-disable-next-line class-methods-use-this
    throwError(msg) {
        throw new Error(msg);
    }
}
//# sourceMappingURL=options.js.map