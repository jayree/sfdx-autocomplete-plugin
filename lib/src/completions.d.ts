import { flags } from '@oclif/command';
export declare const oneDay: number;
export declare class CompletionLookup {
    private readonly cmdId;
    private readonly name;
    private readonly description?;
    private readonly key;
    private readonly blacklistMap;
    private readonly keyAliasMap;
    private readonly commandArgsMap;
    constructor(cmdId: string, name: string, description?: string);
    run(): flags.ICompletion | undefined;
    private argAlias;
    private keyAlias;
    private descriptionAlias;
    private blacklisted;
}
export declare const loglevelCompletion: flags.ICompletion;
export declare const resultformatCompletion: flags.ICompletion;
export declare const instanceurlCompletion: flags.ICompletion;
export declare const targetUserNameCompletion: flags.ICompletion;
export declare const CompletionMapping: {
    [key: string]: flags.ICompletion;
};
