import { flags } from '@salesforce/command';
import { ux } from 'cli-ux';
import * as fs from 'fs-extra';
import * as path from 'path';

import { AutocompleteBase } from '../../base';

export default class Doctor extends AutocompleteBase {
  public static aliases = ['autocomplete:doctor'];

  public static hidden = true;
  public static description = 'autocomplete diagnostic';
  public static args = [
    {
      name: 'shell',
      description: 'shell type',
      required: false
    }
  ];
  protected static flagsConfig = {
    debug: flags.boolean({
      description: 'list completable commands'
    })
  };

  public async run() {
    const shell = this.args.shell || this.config.shell;
    this.errorIfNotSupportedShell(shell);

    const data = [];

    // cli version
    data.push({
      name: 'cli version',
      value: this.config.version
    });

    // plugin version
    const pjson = require(path.resolve(__dirname, '..', '..', '..', '..', 'package.json'));
    data.push({
      name: 'plugin version',
      value: pjson.version
    });

    // check shell shim source env var
    // i.e. SFDX_AC_<shell>_SETUP_PATH
    const shellProfilePath = path.join(process.env.HOME || '', shell === 'zsh' ? '.zshrc' : '.bashrc');
    const shellProfile = fs.readFileSync(shellProfilePath);
    const regex = /AC_\w+_SETUP_PATH/;
    const shimVlaue = regex.exec(shellProfile.toString()) ? 'present' : 'missing';
    data.push({
      name: `~/${shell === 'zsh' ? '.zshrc' : '.bashrc'} shimmed`,
      value: shimVlaue
    });

    // check shell shim
    const shellCompletion = path.join(this.autocompleteCacheDir, `${shell}_setup`);
    const shellCompletionValue = fs.existsSync(shellCompletion) ? 'present' : 'missing';
    data.push({
      name: `${shell} shim file`,
      value: shellCompletionValue
    });

    // check shell command cache
    const shellCmdCache = path.join(this.autocompleteCacheDir, shell === 'zsh' ? 'commands_setters' : 'commands');
    const shellCmdCacheValue = fs.existsSync(shellCmdCache) ? 'present' : 'missing';
    data.push({
      name: `${shell} commands cache`,
      value: shellCmdCacheValue
    });

    // check app completion cache
    const targetusernamesCache = path.join(this.completionsCacheDir, 'targetusername');
    let targetusernamesCacheValue;
    if (fs.existsSync(targetusernamesCache)) {
      const length = fs.readJSONSync(targetusernamesCache).length;
      targetusernamesCacheValue = length ? length : 'empty';
    } else {
      targetusernamesCacheValue = 'missing';
    }

    data.push({
      name: 'targetusernames completion cache',
      value: targetusernamesCacheValue
    });

    ux.table(
      data,
      {
        name: {},
        value: {}
      },
      { 'no-header': true }
    );

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
              const flag = c.flags[f];
              if (flag.type === 'option') {
                out += '=';
              }
              if (flag.hasOwnProperty('completion') || this.findCompletion(c.id, f, flag.description)) {
                out += '(c)';
              }
              if (flag.hidden) out += '(h)';
              return out;
            });
            if (results.length) {
              this.log(`${c.id} -> ${results}`);
            }
          }
        } catch {
          this.log(`Error creating autocomplete for command ${c.id}`);
        }
      });
    });
  }
}
