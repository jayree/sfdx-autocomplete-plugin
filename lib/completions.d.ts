import { Completion } from '@oclif/core/lib/interfaces';
export declare const oneDay: number;
export declare class CompletionLookup {
    private readonly cmdId;
    private readonly name;
    private readonly description?;
    private readonly blacklistMap;
    private readonly keyAliasMap;
    private readonly commandArgsMap;
    constructor(cmdId: string, name: string, description?: string);
    private get key();
    run(): Completion | undefined;
    private argAlias;
    private keyAlias;
    private descriptionAlias;
    private blacklisted;
}
export declare const instanceurlCompletion: Completion;
export declare const targetUserNameCompletion: Completion;
export declare const CompletionMapping: {
    [key: string]: Completion;
};
