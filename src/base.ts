import { Config, Plugin } from '@oclif/config';
import { SfdxCommand } from '@salesforce/command';
import * as fs from 'fs-extra';
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
  public async ensureCommands() {
    const cache = JSON.parse(await fs.readFile(path.resolve(this.sfdxCacheDir, 'plugins.json'), 'utf8')).plugins;
    this.config.plugins = [];

    for (const pluginDir of Object.keys(cache)) {
      const root = path.resolve(pluginDir, 'package.json');
      try {
        const pjson = JSON.parse(await fs.readFile(root, 'utf8'));
        if (pjson.files) {
          const plugin = new Plugin({ root });
          await plugin.load();
          this.logger.info('plugin loaded: ' + root);
          this.config.plugins.push(plugin);
        } else {
          this.logger.warn('plugin not vaild: ' + root);
          this.config.plugins.push(cache[pluginDir]);
        }
      } catch (err) {
        /* istanbul ignore else*/
        if (err.code === 'ENOENT') {
          this.logger.warn('File not found: ' + root);
          this.config.plugins.push(cache[pluginDir]);
        } else {
          this.logger.error(err.message);
          throw err;
        }
      }
    }
  }

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

  protected wantsLocalFiles(flag: string) {
    return ['file', 'procfile', 'configfile'].includes(flag);
  }
}
