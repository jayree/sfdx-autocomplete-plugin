import { AutocompleteBase } from '../../base.js';
export default class Script extends AutocompleteBase {
    static aliases: string[];
    static readonly description = "display autocomplete setup script for shell";
    static hidden: boolean;
    static args: {
        shell: import("@oclif/core/lib/interfaces/parser.js").Arg<string, Record<string, unknown>>;
    };
    private get prefix();
    run(): Promise<void>;
}
