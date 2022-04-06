import { AutocompleteBase } from '../../base';
export default class Script extends AutocompleteBase {
    static aliases: string[];
    static description: string;
    static hidden: boolean;
    static args: {
        name: string;
        description: string;
        required: boolean;
    }[];
    private get prefix();
    run(): Promise<void>;
}
