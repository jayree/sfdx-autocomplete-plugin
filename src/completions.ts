import { IConfig } from '@oclif/config';
import { core } from '@salesforce/command';
import * as fs from 'fs-extra';
import * as path from 'path';

export const oneDay = 60 * 60 * 24;

export declare type ICompletionContext = {
  args?: {
    [name: string]: string;
  };
  flags?: {
    [name: string]: string;
  };
  argv?: string[];
  config: IConfig;
};
export declare type ICompletion = {
  skipCache?: boolean;
  cacheDuration?: number;
  cacheKey?(ctx: ICompletionContext): Promise<string>;
  options(ctx: ICompletionContext): Promise<string[]>;
};

export const targetUserNameCompletion: ICompletion = {
  cacheDuration: oneDay,
  options: async () => {
    const aliases = Object.keys(
      (await fs.readJSON(path.join(core.Global.DIR, core.Aliases.getFileName())))[core.AliasGroup.ORGS]
    );
    // console.log(await core.AuthInfo.listAllAuthFiles());
    const aliasesToDelete = [];
    /*     for (const a of aliases) {
      try {
        const org = await core.Org.create({
          aliasOrUsername: a
        });
        await org.refreshAuth();
        // console.log(org.getField(core.Org.Fields['STATUS']));
      } catch (error) {
        aliasesToDelete.push(a);
      }
    } */

    await Promise.all(
      aliases.map(async a => {
        try {
          const org = await core.Org.create({
            aliasOrUsername: a
          });
          await org.refreshAuth();
          // console.log(org.getField(core.Org.Fields['STATUS']));
        } catch (error) {
          aliasesToDelete.push(a);
        }
      })
    );
    return aliases.filter(alias => !aliasesToDelete.includes(alias));
  }
};

export const completionMapping: { [key: string]: ICompletion } = {
  targetusername: targetUserNameCompletion
};
