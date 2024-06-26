import { AutocompleteBase } from '../../base.js';
export default class Doctor extends AutocompleteBase {
    static aliases: string[];
    static hidden: boolean;
    static readonly description = "autocomplete diagnostic";
    static args: {
        shell: import("@oclif/core/interfaces").Arg<string | undefined, Record<string, unknown>>;
    };
    static flags: {
        debug: import("@oclif/core/interfaces").BooleanFlag<boolean>;
    };
    run(): Promise<void>;
    private printList;
}
