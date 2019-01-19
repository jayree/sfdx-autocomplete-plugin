import { IConfig } from '@oclif/config';
import * as fs from 'fs-extra';

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
    return Object.keys((await fs.readJSON(global.config.home + '/.sfdx/alias.json'))['orgs']);
  }
};

export const completionMapping: { [key: string]: ICompletion } = {
  targetusername: targetUserNameCompletion
};
