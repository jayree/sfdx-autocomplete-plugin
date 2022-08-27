import { AutocompleteBase } from '../../base.js';
export default class Index extends AutocompleteBase {
    static description: string;
    static args: {
        name: string;
        description: string;
        required: boolean;
    }[];
    static flags: {
        'refresh-cache': import("@oclif/core/lib/interfaces/parser.js").BooleanFlag<boolean>;
        suppresswarnings: import("@oclif/core/lib/interfaces/parser.js").BooleanFlag<boolean>;
    };
    run(): Promise<void>;
    private updateCache;
}
