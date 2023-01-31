import { Command } from '@oclif/core';
export type Completion = {
    skipCache?: boolean;
    cacheDuration?: number;
    cacheKey?(ctx: Command.Class): Promise<string>;
    options(ctx: Command.Class): Promise<string[]>;
};
export declare class CompletionLookup {
    private readonly cmdId;
    private readonly name;
    private readonly description?;
    private readonly blocklistMap;
    private readonly keyAliasMap;
    private readonly commandArgsMap;
    constructor(cmdId: string, name: string, description?: string);
    private get key();
    run(): Completion | undefined;
    private argAlias;
    private keyAlias;
    private descriptionAlias;
    private blocklisted;
}
export declare const instanceurlCompletion: Completion;
export declare const targetUserNameCompletion: Completion;
export declare const CompletionMapping: {
    [key: string]: Completion;
};
