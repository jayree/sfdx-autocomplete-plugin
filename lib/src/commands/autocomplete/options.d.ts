import { AutocompleteBase } from '../../base';
export default class Options extends AutocompleteBase {
    static hidden: boolean;
    static description: string;
    static args: {
        name: string;
        strict: boolean;
    }[];
    parsedArgs: {
        [name: string]: string;
    };
    parsedFlags: {
        [name: string]: string;
    };
    run(): Promise<void>;
    private processCommandLine;
    private determineCompletion;
    private fetchOptions;
    private get parsedFlagsWithEnvVars();
    private throwError;
    private findFlagFromWildArg;
    private determineCmdState;
}
