/*
 * Copyright (c) 2022, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
// eslint-disable-next-line sf-plugin/no-oclif-flags-command-import
import { Args, Command } from '@oclif/core';
import { AutocompleteBase } from '../../base.js';

export default class Options extends AutocompleteBase {
  public static aliases = ['autocomplete:options'];

  public static hidden = true;
  public static readonly description =
    'display arg or flag completion options (used internally by completion fuctions)';
  /*   public static flags = {
    app: flags.app({ required: false, hidden: true })
  }; */

  public static args = {
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

  public async run(): Promise<void> {
    this.errorIfWindows();

    // ex: heroku autocomplete:options 'heroku addons:destroy -a myapp myaddon'
    try {
      const commandStateVars = await this.processCommandLine();
      const completion = this.determineCompletion(commandStateVars);
      const options = await this.fetchOptions(completion);
      if (options) this.log(options);
    } catch (err) {
      // write to ac log
      this.writeLogFile(err.message as string);
    }
  }

  private async processCommandLine() {
    // find command id
    const commandLineToComplete = this.argv[0].split(' ');
    const id = commandLineToComplete[1];
    // find Command
    const C = this.config.findCommand(id);
    let klass: Command.Class;
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
    } else {
      this.throwError(`Command ${id} not found`);
    }
  }

  private determineCompletion(commandStateVars: {
    id: string;
    klass: Command.Class;
    argsIndex: number;
    curPositionIsFlag: boolean;
    curPositionIsFlagValue: boolean;
    slicedArgv: string[];
  }) {
    const { id, klass, argsIndex, curPositionIsFlag, curPositionIsFlagValue, slicedArgv } = commandStateVars;
    // setup empty cache completion vars to assign
    let cacheKey: string;
    let cacheCompletion: any;

    // completing a flag/value? else completing an arg
    if (curPositionIsFlag || curPositionIsFlagValue) {
      const slicedArgvCount = slicedArgv.length;
      const lastArgvArg = slicedArgv[slicedArgvCount - 1];
      const previousArgvArg = slicedArgv[slicedArgvCount - 2];
      const argvFlag: string = curPositionIsFlagValue ? previousArgvArg : lastArgvArg;
      const { name, flag } = this.findFlagFromWildArg(argvFlag, klass);
      if (!flag) this.throwError(`${argvFlag} is not a valid flag for ${id}`);
      cacheKey = name || flag.name;
      cacheCompletion = flag.completion;
      if (!cacheCompletion) {
        if (flag.options) {
          cacheCompletion = {
            skipCache: true,

            // eslint-disable-next-line @typescript-eslint/require-await
            options: async () => flag.options,
          };
        }
      }
    } else {
      const cmdArgs = klass.args || {};
      // variable arg (strict: false)
      if (!klass.strict) {
        cacheKey = cmdArgs[0]?.name.toLowerCase();
        cacheCompletion = this.findCompletion(id, cacheKey);
        if (!cacheCompletion) {
          this.throwError(`Cannot complete variable arg position for ${id}`);
        }
      } else if (argsIndex > Object.keys(cmdArgs).length - 1) {
        this.throwError(`Cannot complete arg position ${argsIndex} for ${id}`);
      } else {
        const arg = cmdArgs[argsIndex];
        cacheKey = arg.name.toLowerCase();
      }
    }

    // try to auto-populate the completion object
    if (!cacheCompletion) {
      cacheCompletion = this.findCompletion(id, cacheKey);
    }
    return { cacheKey, cacheCompletion };
  }

  // eslint-disable-next-line class-methods-use-this
  private throwError(msg: string) {
    throw new Error(msg);
  }

  // eslint-disable-next-line class-methods-use-this
  private findFlagFromWildArg(wild: string, klass: Command.Class): { flag: any; name: any } {
    let name = wild.replace(/^-+/, '');
    name = name.replace(/=(.+)?$/, '');

    const unknown = { flag: undefined, name: undefined };
    if (!klass.flags) return unknown;
    const cFlags = klass.flags;

    let flag = cFlags[name];
    if (flag) return { name, flag };

    name = Object.keys(cFlags).find((k: string) => cFlags[k].char === name) || 'undefinedcommand';
    flag = cFlags?.[name];
    if (flag) return { name, flag };
    return unknown;
  }

  private determineCmdState(argv: string[], klass: Command.Class): [number, boolean, boolean] {
    const args = klass.args || {};
    let needFlagValueSatisfied = false;
    let argIsFlag = false;
    let argIsFlagValue = false;
    let argsIndex = -1;
    let flagName: string;

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
        if (flagName) this.parsedFlags[flagName] = wild;

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
}
