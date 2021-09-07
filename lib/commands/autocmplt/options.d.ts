import { AutocompleteBase } from '../../base';
export default class Options extends AutocompleteBase {
    static aliases: string[];
    static hidden: boolean;
    static description: string;
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
