import { AutocompleteBase } from '../../base.js';
export default class Script extends AutocompleteBase {
    static aliases: string[];
    static readonly description = "display autocomplete setup script for shell";
    static hidden: boolean;
    static args: {
        name: string;
        description: string;
        required: boolean;
    }[];
    private get prefix();
    run(): Promise<void>;
}
