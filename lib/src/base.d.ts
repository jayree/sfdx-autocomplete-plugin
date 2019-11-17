import { flags } from '@oclif/command';
import { SfdxCommand } from '@salesforce/command';
export declare abstract class AutocompleteBase extends SfdxCommand {
    errorIfWindows(): void;
    errorIfNotSupportedShell(shell: string): void;
    get autocompleteCacheDir(): string;
    get completionsCacheDir(): string;
    get acLogfilePath(): string;
    writeLogFile(msg: string): void;
    protected findCompletion(cmdId: string, name: string, description?: string): flags.ICompletion | undefined;
}
