import { flags } from '@salesforce/command';
import { AutocompleteBase } from '../../base';
export default class Index extends AutocompleteBase {
    static description: string;
    static args: {
        name: string;
        description: string;
        required: boolean;
    }[];
    static examples: string[];
    protected static flagsConfig: {
        'refresh-cache': flags.Discriminated<flags.Boolean<boolean>>;
        suppresswarnings: flags.Discriminated<flags.Boolean<boolean>>;
    };
    run(): Promise<void>;
    private updateCache;
}
