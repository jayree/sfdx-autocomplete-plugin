import { AutocompleteBase } from '../../base.js';
export default class Index extends AutocompleteBase {
    static readonly description = "display autocomplete installation instructions";
    static args: {
        shell: import("@oclif/core/interfaces").Arg<string | undefined, Record<string, unknown>>;
    };
    static flags: {
        'refresh-cache': import("@oclif/core/interfaces").BooleanFlag<boolean>;
    };
    run(): Promise<void>;
    private updateCache;
}
