import { Command } from '@oclif/core';
import { AutocompleteBase } from '../../base.js';
export default class Options extends AutocompleteBase {
    static aliases: string[];
    static hidden: boolean;
    static readonly description = "display arg or flag completion options (used internally by completion fuctions)";
    static args: {
        completion: import("@oclif/core/lib/interfaces/parser.js").Arg<string, Record<string, unknown>>;
    };
    run(): Promise<void>;
    findFlagFromWildArg(wild: string, klass: Command.Class): {
        flag: Command.Flag.Cached;
        name: string;
    };
    determineCmdState(argv: string[], klass: Command.Class): [number, boolean, boolean];
    private processCommandLine;
    private determineCompletion;
    private throwError;
}
