import { flags } from '@oclif/command';
import { SfdxCommand } from '@salesforce/command';
export declare abstract class AutocompleteBase extends SfdxCommand {
    parsedArgs: {
        [name: string]: string;
    };
    parsedFlags: {
        [name: string]: string;
    };
    errorIfWindows(): void;
    errorIfNotSupportedShell(shell: string): void;
    get autocompleteCacheDir(): string;
    get completionsCacheDir(): string;
    get acLogfilePath(): string;
    writeLogFile(msg: string): void;
    protected fetchOptions(cache: any): Promise<string>;
    protected findCompletion(cmdId: string, name: string, description?: string): flags.ICompletion | undefined;
}
