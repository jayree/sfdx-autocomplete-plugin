import { flags } from '@salesforce/command';
import chalk from 'chalk';
import { AutocompleteBase } from '../../base';
import Create from './create';

export default class Index extends AutocompleteBase {
  public static description = 'display autocomplete installation instructions';

  public static args = [{ name: 'shell', description: 'shell type', required: false }];

  public static examples = [
    '$ <%= config.bin %> autocomplete',
    '$ <%= config.bin %> autocomplete bash',
    '$ <%= config.bin %> autocomplete zsh',
    '$ <%= config.bin %> autocomplete --refresh-cache'
  ];

  protected static flagsConfig = {
    'refresh-cache': flags.boolean({
      description: 'Refresh cache (ignores displaying instructions)',
      char: 'r'
    })
  };

  public async run() {
    const shell = this.args.shell /* istanbul ignore next */ || this.config.shell;

    this.errorIfNotSupportedShell(shell);

    const isInTest = typeof global.it === 'function';

    /* istanbul ignore next */
    if (!isInTest) this.ux.startSpinner(`${chalk.bold('Building the autocomplete cache')}`);
    await Create.run([], this.config);
    /* istanbul ignore next */
    if (!isInTest) this.ux.stopSpinner();

    /* istanbul ignore else*/
    if (!this.flags['refresh-cache']) {
      const bin = this.cliBin;
      const tabStr = shell === 'bash' ? '<TAB><TAB>' : '<TAB>';
      const note =
        shell === 'zsh'
          ? `After sourcing, you can run \`${chalk.cyan(
              '$ compaudit -D'
            )}\` to ensure no permissions conflicts are present`
          : 'If your terminal starts as a login shell you may need to print the init script into ~/.bash_profile or ~/.profile.';

      this.ux.log(`
${chalk.bold(`Setup Instructions for ${bin.toUpperCase()} CLI Autocomplete ---`)}

1) Add the autocomplete env var to your ${shell} profile and source it
${chalk.cyan(`$ printf "$(${bin} autocomplete:script ${shell})" >> ~/.${shell}rc; source ~/.${shell}rc`)}

NOTE: ${note}

2) Test it out, e.g.:
${chalk.cyan(`$ ${bin} ${tabStr}`)}                 # Command completion
${chalk.cyan(`$ ${bin} command --${tabStr}`)}       # Flag completion

Enjoy!
`);
    }
  }
}
