import * as path from 'path';
import { Hook } from '@oclif/config';
import cli from 'cli-ux';
import * as fs from 'fs-extra';
import { targetUserNameCompletion } from '../completions';

import { updateCache } from '../cache';
import acCreate from '../commands/autocmplt/create';

// tslint:disable-next-line: no-any
export const completions: Hook<any> = async function ({ type }: { type?: 'targetusername' }) {
  // autocomplete is now in core, skip windows
  if (this.config.windows) return;
  const completionsDir = path.join(this.config.cacheDir, 'autocomplete', 'completions');
  const rm = () => fs.emptyDir(completionsDir);
  const rmKey = (cacheKey: string) => fs.remove(path.join(completionsDir, cacheKey));

  if (type === 'targetusername') {
    return rmKey('targetusername');
  }

  // tslint:disable-next-line: no-any
  const update = async (completion: any, cacheKey: string) => {
    const cachePath = path.join(completionsDir, cacheKey);
    const options = await completion.options({ config: this.config });
    await updateCache(cachePath, options);
  };

  let suppresswarnings;

  const suppresswarningsfile = path.join(this.config.cacheDir, 'sfdx-autocmplt', 'suppresswarnings');

  try {
    suppresswarnings = await fs.readJson(suppresswarningsfile);
  } catch (err) {
    suppresswarnings = {
      SuppressUpdateWarning: false,
    };
  }

  if (this.config.plugins.filter((p) => p.name === '@oclif/plugin-autocomplete').length) {
    if (!suppresswarnings.SuppressUpdateWarning) {
      cli.styledHeader('sfdx-autocmplt');
      cli.warn(
        `'@oclif/plugin-autocomplete' plugin detected!
Use the 'autocmplt' command instead of 'autocomplete' for improved auto-completion.
Run 'sfdx autocmplt --suppresswarnings' to suppress this warning.`
      );
    }
  } else {
    if (suppresswarnings.SuppressUpdateWarning) {
      try {
        await fs.ensureFile(suppresswarningsfile);
        await fs.writeJson(suppresswarningsfile, {
          SuppressUpdateWarning: false,
        });
        // eslint-disable-next-line no-empty
      } catch (error) {}
    }
  }

  process.once('beforeExit', () => {
    cli.action.start('sfdx-autocmplt: Updating completions');
    void rm();
    void acCreate.run([], this.config);

    try {
      void update(targetUserNameCompletion, 'targetusername');
    } catch (err) {
      this.debug(err.message);
    }
    cli.action.stop();
  });
};
