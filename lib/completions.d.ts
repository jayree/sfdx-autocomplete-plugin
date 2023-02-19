import { Command } from '@oclif/core';
export type Completion = {
    skipCache?: boolean;
    cacheDuration?: number;
    cacheKey?(ctx: Command.Class): Promise<string>;
    options(ctx: Command.Class): Promise<string[]>;
};
export declare class CompletionLookup {
    private readonly name;
    constructor(name: string);
    run(): Completion | undefined;
}
export declare const instanceurlCompletion: Completion;
export declare const targetUserNameCompletion: Completion;
export declare const CompletionMapping: {
    [key: string]: Completion;
};
