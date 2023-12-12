export type Completion = {
    skipCache?: boolean;
    cacheDuration?: number;
    cacheKey?(): Promise<string>;
    options(): Promise<string[]>;
};
export declare class CompletionLookup {
    private readonly name?;
    static readonly targetUserNameCompletion: Completion;
    static readonly instanceurlCompletion: Completion;
    static readonly instanceurlCompletionColon: Completion;
    private readonly topicSeparator;
    readonly CompletionMapping: {
        [key: string]: Completion;
    };
    constructor(name?: string | undefined, topicSeparator?: string);
    run(): Completion | undefined;
}
