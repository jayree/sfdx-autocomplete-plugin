import { flags } from '@oclif/command';
import { SfdxCommand } from '@salesforce/command';
export abstract class AutocompleteBase extends SfdxCommand {
  errorIfWindows(): void;
  errorIfNotSupportedShell(shell: string): void;
  readonly autocompleteCacheDir: string;
  readonly completionsCacheDir: string;
  readonly acLogfilePath: string;
  writeLogFile(msg: string): void;
  protected findCompletion(cmdId: string, name: string, description?: string): flags.ICompletion | undefined;
}
