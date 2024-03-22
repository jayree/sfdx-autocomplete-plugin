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

## Usage

Run `<cli> autocomplete` to generate the autocomplete files for your current shell.

### Topic separator
Since oclif v2 it's possible to use spaces as a topic separator in addition to colons.

For bash and zsh each topic separator has different autocomplete implementations, if the CLI supports using a space as the separator, plugin-autocomplete will generate completion for that topic.

If you still want to use the colon-separated autocomplete you can set `OCLIF_AUTOCOMPLETE_TOPIC_SEPARATOR` to `colon` and re-generate the autocomplete files.

Docs: https://oclif.io/docs/topic_separator

## Commands
<!-- commands -->
* [`sfdx autocmplt`](#sfdx-autocmplt)
* [`sfdx autocomplete create`](#sfdx-autocomplete-create)
* [`sfdx autocomplete doctor`](#sfdx-autocomplete-doctor)
* [`sfdx autocomplete options`](#sfdx-autocomplete-options)
* [`sfdx autocomplete script`](#sfdx-autocomplete-script)

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

_See code: [src/commands/autocmplt/index.ts](https://github.com/jayree/sfdx-autocomplete-plugin/blob/v2.9.43/src/commands/autocmplt/index.ts)_

### `sfdx autocomplete create`

create autocomplete setup scripts and completion functions

```
USAGE
  $ sfdx autocomplete create

DESCRIPTION
  create autocomplete setup scripts and completion functions

ALIASES
  $ sfdx autocomplete create
```

### `sfdx autocomplete doctor`

autocomplete diagnostic

```
USAGE
  $ sfdx autocomplete doctor [SHELL] [--debug]

ARGUMENTS
  SHELL  shell type

FLAGS
  --debug  list completable commands

DESCRIPTION
  autocomplete diagnostic

ALIASES
  $ sfdx autocomplete doctor
```

### `sfdx autocomplete options`

display arg or flag completion options (used internally by completion fuctions)

```
USAGE
  $ sfdx autocomplete options [COMPLETION]

DESCRIPTION
  display arg or flag completion options (used internally by completion fuctions)

ALIASES
  $ sfdx autocomplete options
```

### `sfdx autocomplete script`

display autocomplete setup script for shell

```
USAGE
  $ sfdx autocomplete script SHELL

ARGUMENTS
  SHELL  shell type

DESCRIPTION
  display autocomplete setup script for shell

ALIASES
  $ sfdx autocomplete script
```
<!-- commandsstop -->
