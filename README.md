sfdx-autocomplete
==========================

autocomplete plugin for sfdx (bash & zsh)  
based on [oclif/plugin-autocomplete](https://github.com/oclif/plugin-autocomplete) and
[heroku/heroku-cli-autocomplete](https://github.com/heroku/heroku-cli-autocomplete)

[![sfdx](https://img.shields.io/badge/cli-sfdx-brightgreen.svg)](https://developer.salesforce.com/tools/sfdxcli)
[![Version](https://img.shields.io/npm/v/sfdx-autocmplt.svg)](https://npmjs.org/package/sfdx-autocmplt)
[![CircleCI](https://circleci.com/gh/jayree/sfdx-autocomplete-plugin.svg?style=shield)](https://circleci.com/gh/jayree/sfdx-autocomplete-plugin)
[![Appveyor CI](https://ci.appveyor.com/api/projects/status/github/jayree/sfdx-autocomplete-plugin?branch=master&svg=true)](https://ci.appveyor.com/project/jayree/sfdx-autocomplete-plugin/branch/master)
[![Codecov](https://codecov.io/gh/jayree/sfdx-autocomplete-plugin/branch/master/graph/badge.svg)](https://codecov.io/gh/jayree/sfdx-autocomplete-plugin)
[![Downloads/week](https://img.shields.io/npm/dw/sfdx-autocmplt.svg)](https://npmjs.org/package/sfdx-autocmplt)
[![License](https://img.shields.io/npm/l/sfdx-autocmplt.svg)](https://github.com/jayree/sfdx-autocomplete-plugin/blob/master/package.json)

<!-- toc -->
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->

# Usage

<!-- usage -->
```sh-session
$ sfdx plugins:install sfdx-autocmplt
$ sfdx autocomplete:COMMAND
running command...
$ sfdx plugins
sfdx-autocmplt 2.0.0
$ sfdx help autocomplete:COMMAND
USAGE
  $ sfdx autocomplete:COMMAND
...
```
<!-- usagestop -->

# Commands
<!-- commands -->
* [`sfdx autocomplete [-r] [--json] [--loglevel trace|debug|info|warn|error|fatal]`](#sfdx-autocomplete--r---json---loglevel-tracedebuginfowarnerrorfatal)

## `sfdx autocomplete [-r] [--json] [--loglevel trace|debug|info|warn|error|fatal]`

display autocomplete installation instructions

```
USAGE
  $ sfdx autocomplete [-r] [--json] [--loglevel trace|debug|info|warn|error|fatal]

ARGUMENTS
  SHELL  shell type

OPTIONS
  -r, --refresh-cache                             refresh cache only (ignores displaying instructions)
  --json                                          format output as json
  --loglevel=(trace|debug|info|warn|error|fatal)  [default: warn] logging level for this command invocation

EXAMPLES
  $ sfdx autocomplete
  $ sfdx autocomplete bash
  $ sfdx autocomplete zsh
  $ sfdx autocomplete --refresh-cache
```

_See code: [src/commands/autocomplete/index.ts](https://github.com/jayree/sfdx-autocomplete-plugin/blob/v2.0.0/src/commands/autocomplete/index.ts)_
<!-- commandsstop -->
