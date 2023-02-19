export declare function updateCache(cachePath: string, cache: string[]): Promise<void>;
export declare function fetchCache(cachePath: string, cacheDuration: number, skipCache: boolean, options: {
    cacheFn: () => Promise<string[]>;
}): Promise<string[]>;
