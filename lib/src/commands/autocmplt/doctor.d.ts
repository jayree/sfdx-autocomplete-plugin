import { flags } from '@salesforce/command';
import { AutocompleteBase } from '../../base';
export default class Doctor extends AutocompleteBase {
    static aliases: string[];
    static hidden: boolean;
    static description: string;
    static args: {
        name: string;
        description: string;
        required: boolean;
    }[];
    protected static flagsConfig: {
        debug: flags.Discriminated<flags.Boolean<boolean>>;
    };
    run(): Promise<void>;
    private printList;
}
