import { flags } from '@salesforce/command';
import chalk from 'chalk';
import { cli } from 'cli-ux';
import * as fs from 'fs-extra';
import * as path from 'path';
import { targetUserNameCompletion } from '../../completions';

import { AutocompleteBase } from '../../base';
import { updateCache } from '../../cache';

import Create from './create';

export default class Index extends AutocompleteBase {
  public static aliases = ['autocomplete'];

  public static description = 'display autocomplete installation instructions';

  public static args = [
    {
      name: 'shell',
      description: 'shell type',
      required: false
    }
  ];

  public static examples = [
    '$ sfdx autocmplt',
    '$ sfdx autocmplt bash',
    '$ sfdx autocmplt zsh',
    '$ sfdx autocmplt fish',
    '$ sfdx autocmplt --refresh-cache'
  ];

  protected static flagsConfig = {
    'refresh-cache': flags.boolean({
      description: 'refresh cache only (ignores displaying instructions)',
      char: 'r'
    }),
    suppresswarnings: flags.boolean({
      description: 'suppress warnings',
      hidden: true
    })
  };

  public async run() {
    const shell = this.args.shell || this.config.shell;
    this.errorIfNotSupportedShell(shell);

    cli.action.start(`${chalk.bold('Building the autocomplete cache')}`);
    await Create.run([], this.config);
    await this.updateCache(targetUserNameCompletion, 'targetusername');
    cli.action.stop();

    if (!this.flags['refresh-cache']) {
      const bin = this.config.bin;
      const bashNote =
        'If your terminal starts as a login shell you may need to print the init script into ~/.bash_profile or ~/.profile.';
      const zshNote = `After sourcing, you can run \`${chalk.cyan(
        '$ compaudit -D'
      )}\` to ensure no permissions conflicts are present`;
      const fishNote = 'This assumes your Fish configuration is stored at ~/.config/fish/config.fish';
      const note = shell === 'zsh' ? zshNote : shell === 'bash' ? bashNote : fishNote;
      const tabStr = shell === 'bash' ? '<TAB><TAB>' : '<TAB>';
      const addStr =
        shell === 'fish'
          ? `Update your shell to load the new completions
${chalk.cyan('$ source ~/.config/fish/config.fish')}`
          : `Add the autocomplete env var to your ${shell} profile and source it
${chalk.cyan(`$ printf "$(${bin} autocmplt:script ${shell})" >> ~/.${shell}rc; source ~/.${shell}rc`)}`;

      this.log(`
${chalk.bold(`Setup Instructions for ${bin.toUpperCase()} CLI Autocomplete ---`)}

1) ${addStr}

NOTE: ${note}

2) Test it out, e.g.:
${chalk.cyan(`$ ${bin} ${tabStr}`)}                 # Command completion
${chalk.cyan(`$ ${bin} apps:info --${tabStr}`)}     # Flag completion
${chalk.cyan(`$ ${bin} apps:info --app=${tabStr}`)} # Flag option completion

Enjoy!
`);
    }

    if (this.flags.suppresswarnings) {
      try {
        const suppresswarningsfile = path.join(this.config.cacheDir, 'sfdx-autocmplt', 'suppresswarnings');
        await fs.ensureFile(suppresswarningsfile);
        await fs.writeJson(suppresswarningsfile, {
          SuppressUpdateWarning: true
        });
      } catch (error) {
        this.logger.error(error);
      }
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
