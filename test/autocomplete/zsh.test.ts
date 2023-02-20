/*
 * Copyright (c) 2022, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Config, Command } from '@oclif/core';
import { Plugin as IPlugin, PJSON } from '@oclif/core/lib/interfaces';
import { expect } from 'chai';
import ZshCompWithSpaces from '../../src/autocomplete/zsh-spaces.js';

// eslint-disable-next-line no-underscore-dangle
const __filename = fileURLToPath(import.meta.url);
// eslint-disable-next-line no-underscore-dangle
const __dirname = path.dirname(__filename);

class MyCommandClass implements Command.Cached {
  [key: string]: unknown;

  public args: { [name: string]: Command.Arg.Cached } = {};

  public _base = '';

  public aliases: string[] = [];

  public hidden = false;

  public id = 'foo:bar';

  public flags = {};

  // eslint-disable-next-line class-methods-use-this
  public new(): Command.Cached {
    // @ts-expect-error this is not the full interface but enough for testing
    return {
      _run(): Promise<void> {
        return Promise.resolve();
      },
    };
  }

  // eslint-disable-next-line class-methods-use-this
  public run(): PromiseLike<void> {
    return Promise.resolve();
  }
}

const commandPluginA: Command.Loadable = {
  strict: false,
  aliases: [],
  args: {},
  flags: {
    file: {
      name: 'file',
      type: 'option',
      char: 'f',
      multiple: true,
    },
    'output-dir': {
      name: 'output-dir',
      type: 'option',
    },
    'api-version': {
      name: 'api-version',
      type: 'option',
      char: 'a',
      multiple: false,
    },
    json: {
      name: 'json',
      type: 'boolean',
      summary: 'Format output as json.',
      allowNo: false,
    },
    'ignore-errors': {
      name: 'ignore-errors',
      type: 'boolean',
      char: 'i',
      summary: 'Ignore errors.',
      allowNo: false,
    },
  },
  hidden: false,
  id: 'deploy',
  summary: 'Deploy a project',
  async load(): Promise<Command.Class> {
    return new MyCommandClass() as unknown as Command.Class;
  },
  pluginType: 'core',
  pluginAlias: '@My/plugina',
};

const commandPluginB: Command.Loadable = {
  strict: false,
  aliases: [],
  args: {},
  flags: {
    branch: {
      name: 'branch',
      type: 'option',
      char: 'b',
      multiple: false,
    },
  },
  hidden: false,
  id: 'deploy:functions',
  summary: 'Deploy a function.',
  async load(): Promise<Command.Class> {
    return new MyCommandClass() as unknown as Command.Class;
  },
  pluginType: 'core',
  pluginAlias: '@My/pluginb',
};

const commandPluginC: Command.Loadable = {
  strict: false,
  aliases: [],
  args: {},
  flags: {},
  hidden: false,
  id: 'search',
  summary: 'Search for a command',
  async load(): Promise<Command.Class> {
    return new MyCommandClass() as unknown as Command.Class;
  },
  pluginType: 'core',
  pluginAlias: '@My/pluginc',
};

const commandPluginD: Command.Loadable = {
  strict: false,
  aliases: [],
  args: {},
  flags: {},
  hidden: false,
  id: 'app:execute:code',
  summary: 'execute code',
  async load(): Promise<Command.Class> {
    return new MyCommandClass() as unknown as Command.Class;
  },
  pluginType: 'core',
  pluginAlias: '@My/plugind',
};

const pluginA: IPlugin = {
  load: async (): Promise<void> => {},
  findCommand: async (): Promise<Command.Class> => {
    return new MyCommandClass() as unknown as Command.Class;
  },
  name: '@My/plugina',
  alias: '@My/plugina',
  commands: [commandPluginA, commandPluginB, commandPluginC, commandPluginD],
  _base: '',
  pjson: {} as PJSON.CLI,
  commandIDs: ['deploy'],
  root: '',
  version: '0.0.0',
  type: 'core',
  hooks: {},
  topics: [
    {
      name: 'foo',
      description: 'foo commands',
    },
  ],
  valid: true,
  tag: 'tag',
};

const plugins: IPlugin[] = [pluginA];

describe('zsh completion with spaces', () => {
  const root = path.resolve(__dirname, '../../package.json');
  const config = new Config({ root });

  before(async () => {
    await config.load();
    /* eslint-disable require-atomic-updates */
    config.plugins = plugins;
    config.pjson.oclif.plugins = ['@My/pluginb'];
    config.pjson.dependencies = { '@My/pluginb': '0.0.0' };
    for (const plugin of config.plugins) {
      // @ts-expect-error private method
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      config.loadCommands(plugin);
      // @ts-expect-error private method
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      config.loadTopics(plugin);
    }
  });

  it('generates a valid completion file.', async () => {
    config.bin = 'test-cli';
    const zshCompWithSpaces = new ZshCompWithSpaces(config);
    expect(await zshCompWithSpaces.generate()).to.equal(`#compdef test-cli

_test-cli_app() {
  local context state state_descr line
  typeset -A opt_args

  _arguments -C "1: :->cmds" "*::arg:->args"

  case "$state" in
    cmds)
      _values "completions" \\
              "execute[execute code]"
      ;;
    args)
      case $line[1] in
        "execute")
          _test-cli_app_execute
        ;;
      esac
      ;;
  esac
}

_test-cli_app_execute() {
  local context state state_descr line
  typeset -A opt_args

  _arguments -C "1: :->cmds" "*::arg:->args"

  case "$state" in
    cmds)
      _values "completions" \\
              "code[execute code]"
      ;;
    args)
      case $line[1] in
        "code")
          _arguments -S \\
                     --help"[Show help for command]"
          ;;
      esac
      ;;
  esac
}

_test-cli_deploy() {
  local context state state_descr line
  typeset -A opt_args

  _arguments -C "1: :->cmds" "*::arg:->args"

  case "$state" in
    cmds)
      _values "completions" \\
              "functions[Deploy a function.]" \\
              "*"{-f,--file}"[]:file:_files" \\
              --output-dir"[]:dir:_files -/" \\
              "(-a --api-version)"{-a,--api-version}"[]:" \\
              --json"[Format output as json.]" \\
              "(-i --ignore-errors)"{-i,--ignore-errors}"[Ignore errors.]" \\
              --help"[Show help for command]"
      ;;
    args)
      case $line[1] in
        "functions")
          _arguments -S \\
                     "(-b --branch)"{-b,--branch}"[]:" \\
                     --help"[Show help for command]"
          ;;
      esac
      ;;
  esac
}

_test-cli() {
  local context state state_descr line
  typeset -A opt_args

  _arguments -C "1: :->cmds" "*::arg:->args"

  case "$state" in
    cmds)
      _values "completions" \\
              "app[execute code]" \\
              "deploy[Deploy a project]" \\
              "search[Search for a command]"
      ;;
    args)
      case $line[1] in
        app)
          _test-cli_app
          ;;
        deploy)
          _test-cli_deploy
          ;;
      esac
      ;;
  esac
}

_test-cli
`);
  });
});
