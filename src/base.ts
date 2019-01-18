import { Config } from '@oclif/config';
import { SfdxCommand } from '@salesforce/command';
import * as path from 'path';
import { completionMapping } from './completions';

declare global {
  namespace NodeJS {
    interface Global {
      config: Config;
    }
  }
}

export abstract class AutocompleteBase extends SfdxCommand {
  public get cliBin() {
    return global.config.bin;
  }

  public get cliBinEnvVar() {
    return global.config.bin.toUpperCase().replace('-', '_');
  }

  public get autocompleteCacheDir(): string {
    return path.join(global.config.cacheDir, 'autocomplete');
  }

  public get sfdxCacheDir(): string {
    return path.resolve(global.config.cacheDir);
  }

  public get completionsCacheDir(): string {
    return path.join(global.config.cacheDir, 'autocomplete', 'completions');
  }

  public errorIfWindows() {
    /* istanbul ignore next */
    if (this.config.windows) {
      throw new Error('Autocomplete is not currently supported in Windows');
    }
  }

  public errorIfNotSupportedShell(shell: string) {
    /* istanbul ignore next */
    if (!shell) {
      this.error('Missing required argument shell');
    }
    this.errorIfWindows();
    if (!['bash', 'zsh'].includes(shell)) {
      throw new Error(`${shell} is not a supported shell for autocomplete`);
    }
  }

  // tslint:disable-next-line: no-any
  protected findCompletion(name: string, id: string): any | undefined {
    return completionMapping[name];
  }
}
