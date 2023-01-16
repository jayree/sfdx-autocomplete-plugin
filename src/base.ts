/*
 * Copyright (c) 2022, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import path from 'node:path';
import { Completion } from '@oclif/core/lib/interfaces/index.js';
import { SfCommand } from '@salesforce/sf-plugins-core';
import fs from 'fs-extra';

import { fetchCache } from './cache.js';
import { CompletionLookup } from './completions.js';

export abstract class AutocompleteBase extends SfCommand<void> {
  public static readonly enableJsonFlag = false;
  public parsedArgs: { [name: string]: string } = {};
  public parsedFlags: { [name: string]: string } = {};

  public get cliBin(): string {
    return this.config.bin;
  }

  public get cliBinEnvVar() {
    return this.config.bin.toUpperCase().replace('-', '_');
  }

  public get autocompleteCacheDir(): string {
    return path.join(this.config.cacheDir, 'autocomplete');
  }

  public get completionsCacheDir(): string {
    return path.join(this.config.cacheDir, 'autocomplete', 'completions');
  }

  public get acLogfilePath(): string {
    return path.join(this.config.cacheDir, 'autocomplete.log');
  }

  public errorIfWindows() {
    if (this.config.windows) {
      throw new Error('Autocomplete is not currently supported in Windows');
    }
  }

  public errorIfNotSupportedShell(shell: string) {
    if (!shell) {
      this.error('Missing required argument shell');
    }
    this.errorIfWindows();
    if (!['bash', 'zsh', 'fish'].includes(shell)) {
      throw new Error(`${shell} is not a supported shell for autocomplete`);
    }
  }

  public writeLogFile(msg: string) {
    const now = new Date();
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    const entry = `[${now}] ${msg}\n`;
    const fd = fs.openSync(this.acLogfilePath, 'a');
    fs.writeSync(fd, entry);
  }

  // tslint:disable-next-line: no-any
  protected async fetchOptions(cache: any) {
    const { cacheCompletion, cacheKey } = cache;
    // build/retrieve & return options cache
    if (cacheCompletion?.options) {
      const ctx = {
        args: this.parsedArgs,
        flags: this.parsedFlags,
        argv: this.argv,
        config: this.config,
      };
      // use cacheKey function or fallback to arg/flag name
      const ckey = cacheCompletion.cacheKey ? await cacheCompletion.cacheKey(ctx) : null;
      const key: string = ckey || cacheKey || 'unknown_key_error';
      const flagCachePath = path.join(this.completionsCacheDir, key);

      // build/retrieve cache
      const duration: number = cacheCompletion.cacheDuration || 60 * 60 * 24; // 1 day
      const skip: boolean = cacheCompletion.skipCache || false;
      const opts = { cacheFn: () => cacheCompletion.options(ctx) };
      const options = await fetchCache(flagCachePath, duration, skip, opts);

      // return options cache
      return (options || []).join('\n');
    }
  }

  // eslint-disable-next-line class-methods-use-this
  protected findCompletion(cmdId: string, name: string, description = ''): Completion | undefined {
    return new CompletionLookup(cmdId, name, description).run();
  }
}
