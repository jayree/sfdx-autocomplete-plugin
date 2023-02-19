export type Completion = {
    skipCache?: boolean;
    cacheDuration?: number;
    cacheKey?(): Promise<string>;
    options(): Promise<string[]>;
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
