'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
const config_1 = require('@oclif/config');
const command_1 = require('@salesforce/command');
const chai_1 = require('chai');
const path = require('path');
const options_1 = require('../../../src/commands/autocomplete/options');
const root = path.resolve(__dirname, '../../../../package.json');
const config = new config_1.Config({ root });
class TestCommand extends command_1.SfdxCommand {
  async run() {}
}
TestCommand.description = 'baz';
TestCommand.args = [{ name: 'app', required: false }];
TestCommand.flagsConfig = {
  app: command_1.flags.string({
    char: 'a',
    description: 'app'
  })
};
TestCommand.topic = 'foo';
TestCommand.command = 'bar';
describe('AutocompleteOptions', () => {
  // tslint:disable-next-line: no-any
  let cmd;
  before(async () => {
    await config.load();
    cmd = new options_1.default([], config);
  });
  describe('#findFlagFromWildArg', () => {
    it('finds flag from long and short name', () => {
      let output = cmd.findFlagFromWildArg('--app=my-app', TestCommand);
      chai_1.expect(output.name).to.eq('app');
      output = cmd.findFlagFromWildArg('-a', TestCommand);
      chai_1.expect(output.name).to.eq('app');
    });
    it('returns empty', () => {
      let output = cmd.findFlagFromWildArg('--', TestCommand);
      chai_1.expect(output).to.not.have.property('output.name');
      output = cmd.findFlagFromWildArg('', TestCommand);
      chai_1.expect(output).to.not.have.property('output.name');
    });
  });
  describe('#determineCmdState', () => {
    // foo:bar arg1| false, false
    // foo:bar arg1 | false, false
    // foo:bar arg1 --app=my-app | false, false
    // foo:bar arg1 -| true, false
    // foo:bar arg1 -a| true, false
    // foo:bar arg1 -a | false, true
    // foo:bar arg1 --| true, false
    // foo:bar arg1 --a| true, false
    // foo:bar arg1 --app| true, false
    // foo:bar arg1 --app | false, true
    // foo:bar arg1 --app my| false, true
    // foo:bar arg1 --app=| true, false
    // foo:bar arg1 --app=my| true, false
    // foo:bar -a my-app | false false
    it('finds current state is neither a flag or flag value', () => {
      const [index, isFlag, isFlagValue] = cmd.determineCmdState(['arg1'], TestCommand);
      chai_1.expect([index, isFlag, isFlagValue]).to.include.members([false, false]);
      const [index2, isFlag2, isFlagValue2] = cmd.determineCmdState(['arg1', ''], TestCommand);
      chai_1.expect([index2, isFlag2, isFlagValue2]).to.include.members([false, false]);
      const [index3, isFlag3, isFlagValue3] = cmd.determineCmdState(['arg1', '--app=my-app', ''], TestCommand);
      chai_1.expect([index3, isFlag3, isFlagValue3]).to.include.members([false, false]);
    });
    describe('short flag', () => {
      it('finds current state is a flag', () => {
        const [index, isFlag, isFlagValue] = cmd.determineCmdState(['arg1', '-'], TestCommand);
        chai_1.expect([index, isFlag, isFlagValue]).to.include.members([true, false]);
        const [index2, isFlag2, isFlagValue2] = cmd.determineCmdState(['arg1', '-a'], TestCommand);
        chai_1.expect([index2, isFlag2, isFlagValue2]).to.include.members([true, false]);
      });
      it('finds current state is a flag value', () => {
        const [index, isFlag, isFlagValue] = cmd.determineCmdState(['arg1', '-a', ''], TestCommand);
        chai_1.expect([index, isFlag, isFlagValue]).to.include.members([false, true]);
      });
    });
    describe('long flag', () => {
      it('finds current state is a flag', () => {
        const [index, isFlag, isFlagValue] = cmd.determineCmdState(['arg1', '--'], TestCommand);
        chai_1.expect([index, isFlag, isFlagValue]).to.include.members([0, true, false]);
        const [index2, isFlag2, isFlagValue2] = cmd.determineCmdState(['arg1', '--a'], TestCommand);
        chai_1.expect([index2, isFlag2, isFlagValue2]).to.include.members([0, true, false]);
        const [index3, isFlag3, isFlagValue3] = cmd.determineCmdState(['arg1', '--app'], TestCommand);
        chai_1.expect([index3, isFlag3, isFlagValue3]).to.include.members([0, true, false]);
      });
      it('finds current state is a flag value', () => {
        const [index, isFlag, isFlagValue] = cmd.determineCmdState(['arg1', '--app', ''], TestCommand);
        chai_1.expect([index, isFlag, isFlagValue]).to.include.members([0, false, true]);
        const [index2, isFlag2, isFlagValue2] = cmd.determineCmdState(['arg1', '--app', 'my'], TestCommand);
        chai_1.expect([index2, isFlag2, isFlagValue2]).to.include.members([0, false, true]);
      });
      it('finds current state is a flag (special case)', () => {
        const [index, isFlag, isFlagValue] = cmd.determineCmdState(['arg1', '--app='], TestCommand);
        chai_1.expect([index, isFlag, isFlagValue]).to.include.members([0, true, false]);
        const [index2, isFlag2, isFlagValue2] = cmd.determineCmdState(['arg1', '--app=my'], TestCommand);
        chai_1.expect([index2, isFlag2, isFlagValue2]).to.include.members([0, true, false]);
      });
    });
    describe('args index', () => {
      it('argsIndex is 0', () => {
        const [index, isFlag, isFlagValue] = cmd.determineCmdState(['-a', 'my-app', ''], TestCommand);
        chai_1.expect([index, isFlag, isFlagValue]).to.include.members([0, false, false]);
        chai_1.expect(cmd.parsedArgs).to.deep.equal({ app: '' });
      });
      it('argsIndex is 1', () => {
        const [index, isFlag, isFlagValue] = cmd.determineCmdState(['foo', '-a', 'my-app', ''], TestCommand);
        chai_1.expect([index, isFlag, isFlagValue]).to.include.members([1, false, false]);
        chai_1.expect(cmd.parsedArgs).to.deep.equal({ app: 'foo' });
      });
    });
  });
});
//# sourceMappingURL=options.test.js.map
