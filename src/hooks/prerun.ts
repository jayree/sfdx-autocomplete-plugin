/*
 * Copyright (c) 2022, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { Hook } from '@oclif/core';
import chalk from 'chalk';

// eslint-disable-next-line @typescript-eslint/require-await
export const prerun: Hook<'prerun'> = async function (options) {
  if (options.Command.id === 'autocomplete') {
    process.stderr.write(
      `${chalk.bold.yellow('Warning:')} 'sfdx-autocmplt' plugin detected!\n${chalk.dim(
        "Use 'sfdx autocmplt' for improved auto-completion.",
      )}\n`,
    );
    process.exit(1);
  }
};
