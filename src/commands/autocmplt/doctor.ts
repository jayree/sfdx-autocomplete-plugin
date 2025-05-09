/*
 * Copyright (c) 2022, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { convertToNewTableAPI, Flags } from '@salesforce/sf-plugins-core';
import { Args } from '@oclif/core';
import fs from 'fs-extra';
import { PJSON } from '@oclif/core/interfaces';

// eslint-disable-next-line no-underscore-dangle
const __filename = fileURLToPath(import.meta.url);
// eslint-disable-next-line no-underscore-dangle
const __dirname = dirname(__filename);

import { AutocompleteBase } from '../../base.js';

export default class Doctor extends AutocompleteBase {
  public static aliases = ['autocomplete:doctor'];

  public static hidden = true;
  public static readonly description = 'autocomplete diagnostic';
  public static args = {
    shell: Args.string({ description: 'shell type', required: false }),
  };
  public static flags = {
    ...AutocompleteBase.flags,
    debug: Flags.boolean({
      description: 'list completable commands',
    }),
  };

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(Doctor);
    const shell: string = args.shell ?? this.config.shell;
    this.errorIfNotSupportedShell(shell);

    const data = [];

    // cli version
    data.push({
      name: 'cli version',
      value: this.config.version,
    });

    // plugin version
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const pjson = (await fs.readJson(resolve(__dirname, '..', '..', '..', 'package.json'))) as PJSON;
    data.push({
      name: 'plugin version',
      value: pjson.version,
    });

    // check shell shim source env var
    // i.e. BIN_AC_<shell>_SETUP_PATH
    const shellProfilePath = join(process.env.HOME ?? '', shell === 'zsh' ? '.zshrc' : '.bashrc');
    const shellProfile = fs.readFileSync(shellProfilePath);
    const regex = /AC_\w+_SETUP_PATH/;
    const shimVlaue = regex.exec(shellProfile.toString()) ? 'present' : 'missing';
    data.push({
      name: `~/${shell === 'zsh' ? '.zshrc' : '.bashrc'} shimmed`,
      value: shimVlaue,
    });

    // check shell shim
    const shellCompletion = join(this.autocompleteCacheDir, `${shell}_setup`);
    const shellCompletionValue = fs.existsSync(shellCompletion) ? 'present' : 'missing';
    data.push({
      name: `${shell} shim file`,
      value: shellCompletionValue,
    });

    // check shell command cache
    const shellCmdCache = join(this.autocompleteCacheDir, shell === 'zsh' ? 'commands_setters' : 'commands');
    const shellCmdCacheValue = fs.existsSync(shellCmdCache) ? 'present' : 'missing';
    data.push({
      name: `${shell} commands cache`,
      value: shellCmdCacheValue,
    });

    // check app completion cache
    const targetusernamesCache = join(this.completionsCacheDir, 'targetusername');
    let targetusernamesCacheValue: number | string;
    if (fs.existsSync(targetusernamesCache)) {
      const length = (fs.readJSONSync(targetusernamesCache) as string[]).length;
      targetusernamesCacheValue = length ? length : 'empty';
    } else {
      targetusernamesCacheValue = 'missing';
    }

    data.push({
      name: 'targetusernames completion cache',
      value: targetusernamesCacheValue,
    });
    this.table(
      convertToNewTableAPI(
        data,
        {
          name: {},
          value: {},
        },
        { 'no-header': true },
      ),
    );

    if (flags.debug) this.printList();
  }

  private printList(): void {
    this.log();
    const header = 'Completable Commands';
    this.log(header);
    this.log('='.repeat(header.length));
    this.config.getPluginsList().map((p) => {
      p.commands.map((c) => {
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
              // eslint-disable-next-line no-prototype-builtins
              if (flag.hasOwnProperty('completion') || this.findCompletion(f)) {
                out += '(c)';
              }
              if (flag.hidden) out += '(h)';
              return out;
            });
            if (results.length) {
              // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
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
