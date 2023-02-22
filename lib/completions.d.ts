export type Completion = {
    skipCache?: boolean;
    cacheDuration?: number;
    cacheKey?(): Promise<string>;
    options(): Promise<string[]>;
};
export declare class CompletionLookup {
    private readonly name?;
    private readonly topicSeparator;
    static readonly targetUserNameCompletion: Completion;
    static readonly instanceurlCompletion: Completion;
    static readonly instanceurlCompletionColon: Completion;
    readonly CompletionMapping: {
        [key: string]: Completion;
    };
    constructor(name?: string, topicSeparator?: string);
    run(): Completion | undefined;
}
