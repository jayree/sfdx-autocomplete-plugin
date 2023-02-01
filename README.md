# sfdx-plugin-autocmplt

autocomplete plugin for sfdx (bash & zsh & fish)  
based on [oclif/plugin-autocomplete](https://github.com/oclif/plugin-autocomplete), [heroku/heroku-cli-autocomplete](https://github.com/heroku/heroku-cli-autocomplete)

[![sfdx](https://img.shields.io/badge/cli-sfdx-brightgreen.svg)](https://developer.salesforce.com/tools/sfdxcli)
[![Version](https://img.shields.io/npm/v/sfdx-autocmplt.svg)](https://npmjs.org/package/sfdx-autocmplt)
[![test-and-release](https://github.com/jayree/sfdx-autocomplete-plugin/actions/workflows/release.yml/badge.svg)](https://github.com/jayree/sfdx-autocomplete-plugin/actions/workflows/release.yml)
[![Downloads/week](https://img.shields.io/npm/dw/sfdx-autocmplt.svg)](https://npmjs.org/package/sfdx-autocmplt)
[![License](https://img.shields.io/npm/l/sfdx-autocmplt.svg)](https://github.com/jayree/sfdx-autocomplete-plugin/blob/master/package.json)

## Install

```bash
sfdx plugins:install sfdx-autocmplt
```

## Commands
<!-- commands -->
* [`sfdx autocmplt`](#sfdx-autocmplt)

### `sfdx autocmplt`

display autocomplete installation instructions

```
USAGE
  $ sfdx autocmplt [SHELL] [-r]

ARGUMENTS
  SHELL  shell type

FLAGS
  -r, --refresh-cache  refresh cache only (ignores displaying instructions)

DESCRIPTION
  display autocomplete installation instructions
```

_See code: [src/commands/autocmplt/index.ts](https://github.com/jayree/sfdx-autocomplete-plugin/blob/v2.6.1/src/commands/autocmplt/index.ts)_
<!-- commandsstop -->
