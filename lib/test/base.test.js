'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
const config_1 = require('@oclif/config');
const command_1 = require('@salesforce/command');
const chai_1 = require('chai');
const path = require('path');
const base_1 = require('../src/base');
// autocomplete will throw error on windows
// tslint:disable-next-line: no-var-requires
const { default: runtest } = require('./helpers/runtest');
class AutocompleteTest extends base_1.AutocompleteBase {
  async run() {}
}
AutocompleteTest.id = 'test:foo';
AutocompleteTest.flagsConfig = {
  bar: command_1.flags.boolean({
    description: 'bar'
  })
};
const root = path.resolve(__dirname, '../../package.json');
const config = new config_1.Config({ root });
const cmd = new AutocompleteTest([], config);
runtest('AutocompleteBase', () => {
  before(async () => {
    await config.load();
  });
  it('#errorIfWindows', async () => {
    try {
      new AutocompleteTest([], config).errorIfWindows();
    } catch (e) {
      chai_1.expect(e.message).to.eq('Autocomplete is not currently supported in Windows');
    }
  });
  it('#autocompleteCacheDir', async () => {
    chai_1.expect(cmd.autocompleteCacheDir).to.eq(path.join(config.cacheDir, 'autocomplete'));
  });
  it('#completionsCacheDir', async () => {
    chai_1.expect(cmd.completionsCacheDir).to.eq(path.join(config.cacheDir, 'autocomplete', 'completions'));
  });
  it('#acLogfilePath', async () => {
    chai_1.expect(cmd.acLogfilePath).to.eq(path.join(config.cacheDir, 'autocomplete.log'));
  });
  it('#findCompletion', async () => {
    // tslint:disable-next-line: no-any
    chai_1.expect(cmd.findCompletion(AutocompleteTest.id, 'targetusername')).to.be.ok;
    // tslint:disable-next-line: no-any
    chai_1.expect(cmd.findCompletion(AutocompleteTest.id, 'bar')).to.not.be.ok;
  });
});
//# sourceMappingURL=base.test.js.map
