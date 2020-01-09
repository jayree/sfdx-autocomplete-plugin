"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const completions_1 = require("../src/completions");
// autocomplete will throw error on windows
// tslint:disable-next-line: no-var-requires
const { default: runtest } = require('./helpers/runtest');
runtest('CompletionLookup', () => {
    it('finds completion', async () => {
        const c = new completions_1.CompletionLookup('cmdId', 'app', 'app to use').run();
        chai_1.expect(c).to.eq(completions_1.CompletionMapping.app);
    });
    it('finds completion via command arg lookup', async () => {
        const c = new completions_1.CompletionLookup('config:set', 'key', '').run();
        chai_1.expect(c).to.eq(completions_1.CompletionMapping.configSet);
    });
    it('finds completion via alias lookup', async () => {
        const c = new completions_1.CompletionLookup('config:get', 'key', '').run();
        chai_1.expect(c).to.eq(completions_1.CompletionMapping.config);
    });
    it('finds completion via description lookup', async () => {
        const c = new completions_1.CompletionLookup('cmdId', 'size', 'dyno size to use').run();
        chai_1.expect(c).to.eq(completions_1.CompletionMapping.dynosize);
    });
    it('does not find foo completion', async () => {
        const c = new completions_1.CompletionLookup('cmdId', 'foo', 'foo to use').run();
        chai_1.expect(c).to.not.be.ok;
    });
    /*   it('does not find blacklisted completion', async () => {
      const c = new CompletionLookup('apps:create', 'app', 'app to use').run();
      expect(c).to.not.be.ok;
    }); */
});
//# sourceMappingURL=completions.test.js.map