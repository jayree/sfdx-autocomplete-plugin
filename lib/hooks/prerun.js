import chalk from 'chalk';
// eslint-disable-next-line @typescript-eslint/require-await
export const prerun = async function (options) {
    if (options.Command.id === 'autocomplete') {
        process.stderr.write(`${chalk.bold.yellow('Warning:')} 'sfdx-autocmplt' plugin detected!\n${chalk.dim("Use 'sfdx autocmplt' for improved auto-completion.")}\n`);
        process.exit(1);
    }
};
//# sourceMappingURL=prerun.js.map