import { Config } from '@oclif/core';
export default class ZshCompWithSpaces {
    protected config: Config;
    private topics;
    private commands;
    private coTopics;
    constructor(config: Config);
    generate(bin: string): Promise<string>;
    private genZshFlagArguments;
    private genZshFlagArgumentsBlock;
    private genZshValuesBlock;
    private genZshTopicCompFun;
    private getCoTopics;
    private getTopics;
    private getCommands;
}
