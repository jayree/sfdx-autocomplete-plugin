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

export const loglevelCompletion: ICompletion = {
  skipCache: true,

  options: async () => {
    return ['trace', 'debug', 'info', 'warn', 'error', 'fatal'];
  }
};

export const resultformatCompletion: ICompletion = {
  skipCache: true,

  options: async () => {
    return ['human', 'csv', 'json'];
  }
};

export const instanceurlCompletion: ICompletion = {
  skipCache: true,

  options: async () => {
    return ['https://test.salesforce.com', 'https://login.salesforce.com'];
  }
};

export const targetUserNameCompletion: ICompletion = {
  cacheDuration: oneDay,
  options: async () => {
    try {
      const aliases = Object.keys(
        (await fs.readJSON(path.join(global.config.home, core.Global.STATE_FOLDER, core.Aliases.getFileName())))[
          core.AliasGroup.ORGS
        ]
      );

      const aliasesToDelete = [];

      await Promise.all(
        aliases.map(async a => {
          try {
            const org = await core.Org.create({
              aliasOrUsername: a
            });
            await org.refreshAuth();
          } catch (error /* istanbul ignore next */) {
            aliasesToDelete.push(a);
          }
        })
      );
      return aliases.filter(alias => !aliasesToDelete.includes(alias));
    } catch (error) {
      return [];
    }
  }
};

export const completionMapping: { [key: string]: ICompletion } = {
  targetusername: targetUserNameCompletion,
  loglevel: loglevelCompletion,
  instanceurl: instanceurlCompletion,
  resultformat: resultformatCompletion
};
