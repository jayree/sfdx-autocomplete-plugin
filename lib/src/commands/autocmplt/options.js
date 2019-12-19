"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
// import { flags } from '@salesforce/command';
const path = tslib_1.__importStar(require("path"));
const base_1 = require("../../base");
const cache_1 = require("../../cache");
class Options extends base_1.AutocompleteBase {
    constructor() {
        super(...arguments);
        this.parsedArgs = {};
        this.parsedFlags = {};
    }
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
            const commandStateVars = await this.processCommandLine();
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
    async processCommandLine() {
        // find command id
        const commandLineToComplete = this.argv[0].split(' ');
        const id = commandLineToComplete[1];
        // find Command
        const C = this.config.findCommand(id);
        let klass;
        if (C) {
            klass = C.load();
            // process Command state from command line data
            const slicedArgv = commandLineToComplete.slice(2);
            const [argsIndex, curPositionIsFlag, curPositionIsFlagValue] = this.determineCmdState(slicedArgv, klass);
            return {
                id,
                klass,
                argsIndex,
                curPositionIsFlag,
                curPositionIsFlagValue,
                slicedArgv
            };
        }
        else {
            this.throwError(`Command ${id} not found`);
        }
    }
    // tslint:disable-next-line: no-any
    determineCompletion(commandStateVars) {
        const { id, klass, argsIndex, curPositionIsFlag, curPositionIsFlagValue, slicedArgv } = commandStateVars;
        // setup empty cache completion vars to assign
        // tslint:disable-next-line: no-any
        let cacheKey;
        // tslint:disable-next-line: no-any
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
            cacheCompletion = flag.completion;
        }
        else {
            const cmdArgs = klass.args || [];
            // variable arg (strict: false)
            if (!klass.strict) {
                cacheKey = cmdArgs[0] && cmdArgs[0].name.toLowerCase();
                cacheCompletion = this.findCompletion(id, cacheKey);
                if (!cacheCompletion) {
                    this.throwError(`Cannot complete variable arg position for ${id}`);
                }
            }
            else if (argsIndex > cmdArgs.length - 1) {
                this.throwError(`Cannot complete arg position ${argsIndex} for ${id}`);
            }
            else {
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
    // tslint:disable-next-line: no-any
    async fetchOptions(cache) {
        const { cacheCompletion, cacheKey } = cache;
        // build/retrieve & return options cache
        if (cacheCompletion && cacheCompletion.options) {
            const ctx = {
                args: this.parsedArgs,
                // special case for app & team env vars
                flags: this.parsedFlagsWithEnvVars,
                argv: this.argv,
                config: this.config
            };
            // use cacheKey function or fallback to arg/flag name
            const ckey = cacheCompletion.cacheKey ? await cacheCompletion.cacheKey(ctx) : null;
            const key = ckey || cacheKey || 'unknown_key_error';
            const flagCachePath = path.join(this.completionsCacheDir, key);
            // build/retrieve cache
            const duration = cacheCompletion.cacheDuration || 60 * 60 * 24; // 1 day
            const opts = { cacheFn: () => cacheCompletion.options(ctx) };
            const options = await cache_1.fetchCache(flagCachePath, duration, opts);
            // return options cache
            return (options || []).join('\n');
        }
    }
    get parsedFlagsWithEnvVars() {
        const { flags } = this.parse(Options);
        return Object.assign({ app: process.env.SFDX_APP || flags.app, team: process.env.SFDX_TEAM || process.env.SFDX_ORG }, this.parsedFlags);
    }
    throwError(msg) {
        throw new Error(msg);
    }
    findFlagFromWildArg(wild, klass
    // tslint:disable-next-line: no-any
    ) {
        let name = wild.replace(/^-+/, '');
        name = name.replace(/=(.+)?$/, '');
        const unknown = { flag: undefined, name: undefined };
        if (!klass.flags)
            return unknown;
        const cFlags = klass.flags;
        let flag = cFlags[name];
        if (flag)
            return { name, flag };
        name = Object.keys(cFlags).find((k) => cFlags[k].char === name) || 'undefinedcommand';
        flag = cFlags && cFlags[name];
        if (flag)
            return { name, flag };
        return unknown;
    }
    determineCmdState(argv, klass) {
        const args = klass.args || [];
        let needFlagValueSatisfied = false;
        let argIsFlag = false;
        let argIsFlagValue = false;
        let argsIndex = -1;
        let flagName;
        argv.filter(wild => {
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
            if (argsIndex < args.length) {
                this.parsedArgs[args[argsIndex].name] = wild;
            }
            argIsFlagValue = false;
            needFlagValueSatisfied = false;
            return true;
        });
        return [argsIndex, argIsFlag, argIsFlagValue];
    }
}
exports.default = Options;
Options.aliases = ['autocomplete:options'];
Options.hidden = true;
Options.description = 'display arg or flag completion options (used internally by completion fuctions)';
/*   public static flags = {
  app: flags.app({ required: false, hidden: true })
}; */
Options.args = [{ name: 'completion', strict: false }];
//# sourceMappingURL=options.js.map