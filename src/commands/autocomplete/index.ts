import { flags } from '@salesforce/command';
import chalk from 'chalk';
import { cli } from 'cli-ux';
import * as path from 'path';
import { targetUserNameCompletion } from '../../completions';

import { AutocompleteBase } from '../../base';
import { updateCache } from '../../cache';

import Create from './create';

export default class Index extends AutocompleteBase {
  public static description = 'display autocomplete installation instructions';

  public static args = [
    {
      name: 'shell',
      description: 'shell type',
      required: false
    }
  ];

  public static examples = [
    '$ sfdx autocomplete',
    '$ sfdx autocomplete bash',
    '$ sfdx autocomplete zsh',
    '$ sfdx autocomplete --refresh-cache'
  ];

  protected static flagsConfig = {
    'refresh-cache': flags.boolean({
      description: 'refresh cache only (ignores displaying instructions)',
      char: 'r'
    })
  };

  public async run() {
    const shell = this.args.shell || this.config.shell;
    this.errorIfNotSupportedShell(shell);

    cli.action.start(`${chalk.bold('Building the autocomplete cache')}`);
    await Create.run([], this.config);
    await this.updateCache(targetUserNameCompletion, 'targetusername');
    cli.action.stop();

    if (!flags['refresh-cache']) {
      const bin = this.config.bin;
      const bashNote =
        'If your terminal starts as a login shell you may need to print the init script into ~/.bash_profile or ~/.profile.';
      const zshNote = `After sourcing, you can run \`${chalk.cyan(
        '$ compaudit -D'
      )}\` to ensure no permissions conflicts are present`;
      const note = shell === 'zsh' ? zshNote : bashNote;
      const tabStr = shell === 'bash' ? '<TAB><TAB>' : '<TAB>';

      this.log(`
${chalk.bold(`Setup Instructions for ${bin.toUpperCase()} CLI Autocomplete ---`)}

1) Add the autocomplete env var to your ${shell} profile and source it
${chalk.cyan(`$ printf "$(${bin} autocomplete:script ${shell})" >> ~/.${shell}rc; source ~/.${shell}rc`)}

NOTE: ${note}

2) Test it out, e.g.:
${chalk.cyan(`$ ${bin} ${tabStr}`)}                 # Command completion
${chalk.cyan(`$ ${bin} apps:info --${tabStr}`)}     # Flag completion
${chalk.cyan(`$ ${bin} apps:info --app=${tabStr}`)} # Flag option completion

Enjoy!
`);
    }
  }

  // tslint:disable-next-line: no-any
  private async updateCache(completion: any, cacheKey: string) {
    const cachePath = path.join(this.completionsCacheDir, cacheKey);
    const options = await completion.options({
      config: this.config
    });
    await updateCache(cachePath, options);
  }
}
