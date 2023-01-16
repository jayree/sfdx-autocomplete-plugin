import { AutocompleteBase } from '../../base.js';
export default class Options extends AutocompleteBase {
    static aliases: string[];
    static hidden: boolean;
    static readonly description = "display arg or flag completion options (used internally by completion fuctions)";
    static args: {
        name: string;
        strict: boolean;
    }[];
    run(): Promise<void>;
    private processCommandLine;
    private determineCompletion;
    private throwError;
    private findFlagFromWildArg;
    private determineCmdState;
}
