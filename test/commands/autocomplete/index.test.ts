import { Config } from '@oclif/config';
import { expect, test } from '@salesforce/command/lib/test';
import * as path from 'path';

const root = path.resolve(__dirname, '../package.json');
const config = new Config({ root });

// autocomplete will throw error on windows ci
const skipwindows = process.platform === 'win32' ? describe.skip : describe;

skipwindows('autocomplete', () => {
  before(async () => {
    if (process.platform === 'win32') this.skip();
    await config.load();
    global.config = new Config(config);
    global.config.cacheDir = path.join(__dirname, '../../../../test/assets/cache');
    global.config.bin = 'sfdx';
    this.config = new Config(config);
    this.config.shell = 'bash';
  });

  test
    .stdout()
    .command(['autocomplete'])
    .it('provides bash instructions', ctx => {
      expect(ctx.stdout).to.contain(`
Setup Instructions for SFDX CLI Autocomplete ---

1) Add the autocomplete env var to your bash profile and source it
$ printf \"$(sfdx autocomplete:script bash)\" >> ~/.bashrc; source ~/.bashrc

NOTE: If your terminal starts as a login shell you may need to print the init script into ~/.bash_profile or ~/.profile.

2) Test it out, e.g.:
$ sfdx <TAB><TAB>                 # Command completion
$ sfdx command --<TAB><TAB>       # Flag completion

Enjoy!

`);
    });

  test
    .stdout()
    .command(['autocomplete', 'bash'])
    .it('provides bash instructions', ctx => {
      expect(ctx.stdout).to.contain(`
Setup Instructions for SFDX CLI Autocomplete ---

1) Add the autocomplete env var to your bash profile and source it
$ printf \"$(sfdx autocomplete:script bash)\" >> ~/.bashrc; source ~/.bashrc

NOTE: If your terminal starts as a login shell you may need to print the init script into ~/.bash_profile or ~/.profile.

2) Test it out, e.g.:
$ sfdx <TAB><TAB>                 # Command completion
$ sfdx command --<TAB><TAB>       # Flag completion

Enjoy!

`);
    });

  test
    .stdout()
    .command(['autocomplete', 'zsh'])
    .it('provides zsh instructions', ctx => {
      expect(ctx.stdout).to.contain(`
Setup Instructions for SFDX CLI Autocomplete ---

1) Add the autocomplete env var to your zsh profile and source it
$ printf \"$(sfdx autocomplete:script zsh)\" >> ~/.zshrc; source ~/.zshrc

NOTE: After sourcing, you can run \`$ compaudit -D\` to ensure no permissions conflicts are present

2) Test it out, e.g.:
$ sfdx <TAB>                 # Command completion
$ sfdx command --<TAB>       # Flag completion

Enjoy!

`);
    });
});
