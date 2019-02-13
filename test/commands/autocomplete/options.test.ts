import { Config } from '@oclif/config';
import { SfdxCommand } from '@salesforce/command';
import { expect, test } from '@salesforce/command/lib/test';
import * as path from 'path';

import { fs } from '@salesforce/core';
import Options from '../../../src/commands/autocomplete/options';

const root = path.resolve(__dirname, '../../../package.json');
const config = new Config({ root });

class TestCommand extends SfdxCommand {
  public static topic = 'foo';
  public static command = 'bar';
  public static description = 'baz';
  public static args = [{ name: 'app', required: false }];

  protected static requiresUsername = true;

  public async run() {}
}

class TestCommand2 extends SfdxCommand {
  public static topic = 'foo';
  public static command = 'bar';
  public static description = 'baz';
  public async run() {}
}

describe('AutocompleteOptions', () => {
  // tslint:disable-next-line: no-any
  let cmd: any;
  before(async () => {
    await config.load();
    cmd = new Options([], config);
    global.config.home = path.join(__dirname, '../../../../test/assets/home');
    await fs.remove(path.join(__dirname, '../../../../test/assets/cache/autocomplete/completions'));
  });

  describe('#findFlagFromWildArg', () => {
    test.it('finds flag from long and short name', () => {
      let output = cmd.findFlagFromWildArg('--targetusername=my-app', TestCommand);
      expect(output.name).to.eq('targetusername');
      output = cmd.findFlagFromWildArg('-u', TestCommand);
      expect(output.name).to.eq('targetusername');
    });

    test.it('returns empty', () => {
      let output = cmd.findFlagFromWildArg('--', TestCommand);
      expect(output).to.not.have.property('output.name');
      output = cmd.findFlagFromWildArg('', TestCommand);
      expect(output).to.not.have.property('output.name');
    });
  });

  describe('#determineCmdState', () => {
    test.it('finds current state is neither a flag or flag value', () => {
      const [index, isFlag, isFlagValue] = cmd.determineCmdState(['arg1'], TestCommand);
      expect([index, isFlag, isFlagValue]).to.include.members([false, false]);
      const [index2, isFlag2, isFlagValue2] = cmd.determineCmdState(['arg1', ''], TestCommand);
      expect([index2, isFlag2, isFlagValue2]).to.include.members([false, false]);
      const [index3, isFlag3, isFlagValue3] = cmd.determineCmdState(
        ['arg1', '--targetusername=my-app', ''],
        TestCommand
      );
      expect([index3, isFlag3, isFlagValue3]).to.include.members([false, false]);
      const [index4, isFlag4, isFlagValue4] = cmd.determineCmdState([], TestCommand2);
      expect([index4, isFlag4, isFlagValue4]).to.include.members([false, false]);
    });

    describe('short flag', () => {
      test.it('finds current state is a flag', () => {
        const [index, isFlag, isFlagValue] = cmd.determineCmdState(['arg1', '-'], TestCommand);
        expect([index, isFlag, isFlagValue]).to.include.members([true, false]);
        const [index2, isFlag2, isFlagValue2] = cmd.determineCmdState(['arg1', '-u'], TestCommand);
        expect([index2, isFlag2, isFlagValue2]).to.include.members([true, false]);
      });

      test.it('finds current state is a flag value', () => {
        const [index, isFlag, isFlagValue] = cmd.determineCmdState(['arg1', '-u', ''], TestCommand);
        expect([index, isFlag, isFlagValue]).to.include.members([false, true]);
      });
    });

    describe('long flag', () => {
      test.it('finds current state is a flag', () => {
        const [index, isFlag, isFlagValue] = cmd.determineCmdState(['arg1', '--'], TestCommand);
        expect([index, isFlag, isFlagValue]).to.include.members([0, true, false]);
        const [index2, isFlag2, isFlagValue2] = cmd.determineCmdState(['arg1', '--u'], TestCommand);
        expect([index2, isFlag2, isFlagValue2]).to.include.members([0, true, false]);
        const [index3, isFlag3, isFlagValue3] = cmd.determineCmdState(['arg1', '--targetusername'], TestCommand);
        expect([index3, isFlag3, isFlagValue3]).to.include.members([0, true, false]);
      });

      test.it('finds current state is a flag value', () => {
        const [index, isFlag, isFlagValue] = cmd.determineCmdState(['arg1', '--targetusername', ''], TestCommand);
        expect([index, isFlag, isFlagValue]).to.include.members([0, false, true]);
        const [index2, isFlag2, isFlagValue2] = cmd.determineCmdState(['arg1', '--targetusername', 'my'], TestCommand);
        expect([index2, isFlag2, isFlagValue2]).to.include.members([0, false, true]);
      });

      test.it('finds current state is a flag (special case)', () => {
        const [index, isFlag, isFlagValue] = cmd.determineCmdState(['arg1', '--targetusername='], TestCommand);
        expect([index, isFlag, isFlagValue]).to.include.members([0, true, false]);
        const [index2, isFlag2, isFlagValue2] = cmd.determineCmdState(['arg1', '--targetusername=my'], TestCommand);
        expect([index2, isFlag2, isFlagValue2]).to.include.members([0, true, false]);
      });
    });

    describe('args index', () => {
      test.it('argsIndex is 0', () => {
        const [index, isFlag, isFlagValue] = cmd.determineCmdState(['-u', 'my-app', ''], TestCommand);
        expect([index, isFlag, isFlagValue]).to.include.members([0, false, false]);
        expect(cmd.parsedArgs).to.deep.equal({ app: '' });
      });

      test.it('argsIndex is 1', () => {
        const [index, isFlag, isFlagValue] = cmd.determineCmdState(['foo', '-u', 'my-app', ''], TestCommand);
        expect([index, isFlag, isFlagValue]).to.include.members([1, false, false]);
        expect(cmd.parsedArgs).to.deep.equal({ app: 'foo' });
      });
    });
  });
  describe('test flags', () => {
    test
      .stderr()
      .stdout()
      .command(['autocomplete:options', 'sfdx cachedcommand:test --targetusername'])
      .it('test targetusername', ctx => {
        expect(ctx.stdout).to.contain('my-app');
      });
    test
      .stderr()
      .stdout()
      .command(['autocomplete:options', 'sfdx cachedcommand:test --loglevel'])
      .it('test loglevel', ctx => {
        expect(ctx.stdout).to.contain('debug');
      });
    test
      .stderr()
      .stdout()
      .command(['autocomplete:options', 'sfdx cachedcommand:test --instanceurl'])
      .it('test instanceurl', ctx => {
        expect(ctx.stdout).to.contain('https');
      });
    test
      .stderr()
      .stdout()
      .command(['autocomplete:options', 'sfdx cachedcommand:test --no'])
      .it('test non-existing', ctx => {
        expect(ctx.stdout).to.contain('');
      });
    test
      .stderr()
      .stdout()
      .command(['autocomplete:options', 'sfdx cachedcommand:test'])
      .it('test no flag', ctx => {
        expect(ctx.stdout).to.contain('');
      });
    test
      .stderr()
      .stdout()
      .command(['autocomplete:options', 'sfdx cachedcommand:xxx'])
      .it('test wrong command', ctx => {
        expect(ctx.stdout).to.contain('');
      });
  });
});

describe('AutocompleteOptions (w/o alias.json)', () => {
  before(async () => {
    await config.load();
    global.config.home = path.join(__dirname, '../../../../test/assets/home2');
    await fs.remove(path.join(__dirname, '../../../../test/assets/cache/autocomplete/completions'));
  });

  describe('test flags', () => {
    test
      .stderr()
      .stdout()
      .command(['autocomplete:options', 'sfdx cachedcommand:test --targetusername'])
      .it('test targetusername', ctx => {
        expect(ctx.stdout).to.contain('');
      });
  });
});
