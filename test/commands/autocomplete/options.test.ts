/*
 * Copyright (c) 2022, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Config, Args } from '@oclif/core';
import { SfCommand, Flags } from '@salesforce/sf-plugins-core';
import { expect } from 'chai';

// eslint-disable-next-line no-underscore-dangle
const __filename = fileURLToPath(import.meta.url);
// eslint-disable-next-line no-underscore-dangle
const __dirname = dirname(__filename);

import Options from '../../../src/commands/autocmplt/options.js';

const root = resolve(__dirname, '../../../package.json');
const config = new Config({ root });

class TestCommand extends SfCommand<void> {
  public static description = 'baz';
  public static args = {
    app: Args.string({ required: false }),
  };
  public static flags = {
    app: Flags.string({
      char: 'a',

      description: 'app',
    }),
  };
  protected static topic = 'foo';
  protected static command = 'bar';
  // eslint-disable-next-line class-methods-use-this
  public async run() {}
}

describe('AutocompleteOptions', () => {
  let cmd: Options;
  before(async () => {
    await config.load();
    cmd = new Options([], config);
  });

  describe('#findFlagFromWildArg', () => {
    it('finds flag from long and short name', () => {
      let output = cmd.findFlagFromWildArg('--app=my-app', TestCommand);
      expect(output?.name).to.eq('app');
      output = cmd.findFlagFromWildArg('-a', TestCommand);
      expect(output?.name).to.eq('app');
    });

    it('returns empty', () => {
      let output = cmd.findFlagFromWildArg('--', TestCommand);
      expect(output).to.not.have.property('output.name');
      output = cmd.findFlagFromWildArg('', TestCommand);
      expect(output).to.not.have.property('output.name');
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
      expect([index, isFlag, isFlagValue]).to.include.members([false, false]);
      const [index2, isFlag2, isFlagValue2] = cmd.determineCmdState(['arg1', ''], TestCommand);
      expect([index2, isFlag2, isFlagValue2]).to.include.members([false, false]);
      const [index3, isFlag3, isFlagValue3] = cmd.determineCmdState(['arg1', '--app=my-app', ''], TestCommand);
      expect([index3, isFlag3, isFlagValue3]).to.include.members([false, false]);
    });

    describe('short flag', () => {
      it('finds current state is a flag', () => {
        const [index, isFlag, isFlagValue] = cmd.determineCmdState(['arg1', '-'], TestCommand);
        expect([index, isFlag, isFlagValue]).to.include.members([true, false]);
        const [index2, isFlag2, isFlagValue2] = cmd.determineCmdState(['arg1', '-a'], TestCommand);
        expect([index2, isFlag2, isFlagValue2]).to.include.members([true, false]);
      });

      it('finds current state is a flag value', () => {
        const [index, isFlag, isFlagValue] = cmd.determineCmdState(['arg1', '-a', ''], TestCommand);
        expect([index, isFlag, isFlagValue]).to.include.members([false, true]);
      });
    });

    describe('long flag', () => {
      it('finds current state is a flag', () => {
        const [index, isFlag, isFlagValue] = cmd.determineCmdState(['arg1', '--'], TestCommand);
        expect([index, isFlag, isFlagValue]).to.include.members([0, true, false]);
        const [index2, isFlag2, isFlagValue2] = cmd.determineCmdState(['arg1', '--a'], TestCommand);
        expect([index2, isFlag2, isFlagValue2]).to.include.members([0, true, false]);
        const [index3, isFlag3, isFlagValue3] = cmd.determineCmdState(['arg1', '--app'], TestCommand);
        expect([index3, isFlag3, isFlagValue3]).to.include.members([0, true, false]);
      });

      it('finds current state is a flag value', () => {
        const [index, isFlag, isFlagValue] = cmd.determineCmdState(['arg1', '--app', ''], TestCommand);
        expect([index, isFlag, isFlagValue]).to.include.members([0, false, true]);
        const [index2, isFlag2, isFlagValue2] = cmd.determineCmdState(['arg1', '--app', 'my'], TestCommand);
        expect([index2, isFlag2, isFlagValue2]).to.include.members([0, false, true]);
      });

      it('finds current state is a flag (special case)', () => {
        const [index, isFlag, isFlagValue] = cmd.determineCmdState(['arg1', '--app='], TestCommand);
        expect([index, isFlag, isFlagValue]).to.include.members([0, true, false]);
        const [index2, isFlag2, isFlagValue2] = cmd.determineCmdState(['arg1', '--app=my'], TestCommand);
        expect([index2, isFlag2, isFlagValue2]).to.include.members([0, true, false]);
      });
    });

    describe('args index', () => {
      it('argsIndex is 0', () => {
        const [index, isFlag, isFlagValue] = cmd.determineCmdState(['-a', 'my-app', ''], TestCommand);
        expect([index, isFlag, isFlagValue]).to.include.members([0, false, false]);
        expect(cmd.parsedArgs).to.deep.equal({ app: '' });
      });

      it('argsIndex is 1', () => {
        const [index, isFlag, isFlagValue] = cmd.determineCmdState(['foo', '-a', 'my-app', ''], TestCommand);
        expect([index, isFlag, isFlagValue]).to.include.members([1, false, false]);
        expect(cmd.parsedArgs).to.deep.equal({ app: 'foo' });
      });
    });
  });
});
