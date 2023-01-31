import { AutocompleteBase } from '../../base.js';
export default class Doctor extends AutocompleteBase {
    static aliases: string[];
    static hidden: boolean;
    static readonly description = "autocomplete diagnostic";
    static args: {
        shell: import("@oclif/core/lib/interfaces/parser.js").Arg<string, Record<string, unknown>>;
    };
    static flags: {
        debug: import("@oclif/core/lib/interfaces/parser.js").BooleanFlag<boolean>;
    };
    run(): Promise<void>;
    private printList;
}
