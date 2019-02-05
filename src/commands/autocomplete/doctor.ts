import { flags } from '@salesforce/command';
import * as fs from 'fs-extra';
import * as path from 'path';

import { AutocompleteBase } from '../../base';
import { fetchCache } from '../../cache';

export default class Doctor extends AutocompleteBase {
  public static hidden = true;
  public static description = 'autocomplete diagnostic';
  public static args = [{ name: 'shell', description: 'shell type', required: false }];

  protected static flagsConfig = {
    debug: flags.boolean({ description: 'list completable commands' })
  };

  public async run() {
    this.config.plugins = await fetchCache(path.join(this.autocompleteCacheDir, 'plugins'), 60 * 60 * 24, {
      cacheFn: async () => {
        await this.ensureCommands();
        return this.config.plugins;
      }
    });

    const shell = this.args.shell || this.config.shell;
    this.errorIfNotSupportedShell(shell);

    const data = [];

    // cli version
    data.push({ name: 'cli version', value: this.config.version });

    // plugin version
    const pjson = require(path.resolve(__dirname, '..', '..', '..', '..', 'package.json'));
    data.push({ name: 'plugin version', value: pjson.version });

    // check shell shim source env var
    // i.e. HEROKU_AC_<shell>_SETUP_PATH
    const shellProfilePath = path.join(process.env.HOME || '', shell === 'zsh' ? '.zshrc' : '.bashrc');
    const shellProfile = fs.readFileSync(shellProfilePath);
    const regex = new RegExp(this.cliBinEnvVar + '_AC_\\w+_SETUP_PATH');

    const shimVlaue = regex.exec(shellProfile.toString()) ? 'present' : 'missing';
    data.push({ name: `~/${shell === 'zsh' ? '.zshrc' : '.bashrc'} shimmed`, value: shimVlaue });

    // check shell shim
    const shellCompletion = path.join(this.autocompleteCacheDir, `${shell}_setup`);
    const shellCompletionValue = fs.existsSync(shellCompletion) ? 'present' : 'missing';
    data.push({ name: `${shell} shim file`, value: shellCompletionValue });

    // check shell command cache
    const shellCmdCache = path.join(this.autocompleteCacheDir, shell === 'zsh' ? 'commands_setters' : 'commands');
    const shellCmdCacheValue = fs.existsSync(shellCmdCache) ? 'present' : 'missing';
    data.push({ name: `${shell} commands cache`, value: shellCmdCacheValue });

    // check app completion cache
    const targetusernameCache = path.join(this.completionsCacheDir, 'targetusername');
    let targetusernameCacheValue;
    if (fs.existsSync(targetusernameCache)) {
      const length = fs.readJSONSync(targetusernameCache).length;
      targetusernameCacheValue = length ? length : 'empty';
    } else {
      targetusernameCacheValue = 'missing';
    }

    data.push({ name: 'targetusername completion cache', value: targetusernameCacheValue });

    this.ux.table(data, {
      printHeader: undefined,
      columns: [{ key: 'name' }, { key: 'value' }]
    });

    if (this.flags.debug) this.printList();
  }

  private printList() {
    this.log();
    const header = 'Completable Commands';
    this.log(header);
    this.log('='.repeat(header.length));
    this.config.plugins.map(p => {
      p.commands.map(c => {
        try {
          if (c.hidden) {
            this.log(`${c.id} (hidden)`);
          } else {
            const results = Object.keys(c.flags).map((f: string) => {
              let out = `--${f}`;
              // tslint:disable-next-line: no-any
              const flag: any = c.flags[f];
              if (flag.type === 'option') {
                out += '=';
              }
              if (flag.hasOwnProperty('completion') || this.findCompletion(f, c.id) || this.wantsLocalFiles(f)) {
                out += '(c)';
              }
              if (flag.hidden) {
                out += '(h)';
              }
              return out;
            });
            if (results.length) this.log(`${c.id} -> ${results}`);
          }
        } catch /* istanbul ignore next*/ {
          this.log(`Error creating autocomplete for command ${c.id}`);
        }
      });
    });
  }
}
