import { SfCommand } from '@salesforce/sf-plugins-core';
import { Completion } from './completions.js';
export declare abstract class AutocompleteBase extends SfCommand<void> {
    static readonly enableJsonFlag = false;
    parsedArgs: {
        [name: string]: string;
    };
    parsedFlags: {
        [name: string]: string;
    };
    get cliBin(): string;
    get cliBinEnvVar(): string;
    get autocompleteCacheDir(): string;
    get completionsCacheDir(): string;
    get acLogfilePath(): string;
    errorIfWindows(): void;
    errorIfNotSupportedShell(shell: string): void;
    writeLogFile(msg: string): void;
    protected fetchOptions(cache: any): Promise<string>;
    protected findCompletion(name: string): Completion | undefined;
}
