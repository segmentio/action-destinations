"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const command_1 = require("@oclif/command");
const chalk_1 = tslib_1.__importDefault(require("chalk"));
const fs_extra_1 = tslib_1.__importDefault(require("fs-extra"));
const globby_1 = tslib_1.__importDefault(require("globby"));
const lodash_1 = require("lodash");
const to_title_case_1 = tslib_1.__importDefault(require("to-title-case"));
const ora_1 = tslib_1.__importDefault(require("ora"));
const path_1 = tslib_1.__importDefault(require("path"));
const prompt_1 = require("../../lib/prompt");
const templates_1 = require("../../lib/templates");
const codemods_1 = require("../../lib/codemods");
const types_1 = tslib_1.__importDefault(require("./types"));
class GenerateAction extends command_1.Command {
    constructor() {
        super(...arguments);
        this.spinner = ora_1.default();
    }
    async integrationDirs(glob) {
        const integrationDirs = await globby_1.default(glob, {
            expandDirectories: false,
            onlyDirectories: true,
            gitignore: true,
            ignore: ['node_modules']
        });
        return integrationDirs;
    }
    parseArgs() {
        return this.parse(GenerateAction);
    }
    async run() {
        const { args, flags } = this.parseArgs();
        let integrationsGlob = './packages/destination-actions/src/destinations/*';
        if (args.type.includes('browser')) {
            integrationsGlob = './packages/browser-destinations/src/destinations/*';
        }
        const integrationDirs = await this.integrationDirs(integrationsGlob);
        const answers = await prompt_1.autoPrompt(flags, [
            {
                type: 'text',
                name: 'title',
                message: 'Action title:',
                initial: to_title_case_1.default(args.name),
                format: (val) => to_title_case_1.default(val)
            },
            {
                type: 'select',
                name: 'directory',
                message: 'Which integration (directory)?',
                choices: integrationDirs.map((integrationPath) => {
                    const [name] = integrationPath.split(path_1.default.sep).reverse();
                    return {
                        title: name,
                        value: integrationPath
                    };
                })
            }
        ]);
        const slug = lodash_1.camelCase(args.name);
        const directory = answers.directory || './';
        const relativePath = path_1.default.join(directory, slug);
        const targetDirectory = path_1.default.join(process.cwd(), relativePath);
        const destinationFolder = path_1.default.parse(answers.directory).base;
        const destination = lodash_1.startCase(lodash_1.camelCase(destinationFolder)).replace(/ /g, '');
        const snapshotPath = path_1.default.join(__dirname, '../../../templates/actions/action-snapshot');
        let templatePath = path_1.default.join(__dirname, '../../../templates/actions/empty-action');
        if (args.type === 'browser') {
            templatePath = path_1.default.join(__dirname, '../../../templates/actions/empty-browser-action');
        }
        try {
            this.spinner.start(`Creating ${chalk_1.default.bold(args.name)}`);
            templates_1.renderTemplates(templatePath, targetDirectory, {
                name: answers.title,
                description: '',
                slug,
                destination
            }, flags.force);
            this.spinner.succeed(`Scaffold action`);
        }
        catch (err) {
            this.spinner.fail(`Scaffold action: ${chalk_1.default.red(err.message)}`);
            this.exit();
        }
        try {
            this.spinner.start(`Creating snapshot tests for ${chalk_1.default.bold(`${destination}'s ${slug}`)} destination action`);
            templates_1.renderTemplates(snapshotPath, targetDirectory, {
                destination: destination,
                actionSlug: slug
            }, true);
            this.spinner.succeed(`Creating snapshot tests for ${chalk_1.default.bold(`${destination}'s ${slug}`)} destination action`);
        }
        catch (err) {
            this.spinner.fail(`Snapshot test creation failed: ${chalk_1.default.red(err.message)}`);
            this.exit();
        }
        const entryFile = require.resolve(path_1.default.relative(__dirname, path_1.default.join(process.cwd(), directory)));
        try {
            this.spinner.start(chalk_1.default `Updating destination definition`);
            const destinationStr = fs_extra_1.default.readFileSync(entryFile, 'utf8');
            const exportName = args.type === 'browser' ? 'destination' : 'default';
            const updatedCode = codemods_1.addKeyToExport(destinationStr, exportName, 'actions', slug);
            fs_extra_1.default.writeFileSync(entryFile, updatedCode, 'utf8');
            this.spinner.succeed();
        }
        catch (err) {
            this.spinner.fail(chalk_1.default `Failed to update your destination imports: ${err.message}`);
            this.exit();
        }
        try {
            this.spinner.start(chalk_1.default `Generating types for {magenta ${slug}} action`);
            await types_1.default.run(['--path', entryFile]);
            this.spinner.succeed();
        }
        catch (err) {
            this.spinner.fail(chalk_1.default `Generating types for {magenta ${slug}} action: ${err.message}`);
            this.exit();
        }
        this.log(chalk_1.default.green(`Done creating "${args.name}" 🎉`));
        this.log(chalk_1.default.green(`Start coding! cd ${targetDirectory}`));
    }
    async catch(error) {
        var _a;
        if ((_a = this.spinner) === null || _a === void 0 ? void 0 : _a.isSpinning) {
            this.spinner.fail();
        }
        throw error;
    }
}
exports.default = GenerateAction;
GenerateAction.description = `Scaffolds a new integration action.`;
GenerateAction.examples = [
    `$ ./bin/run generate:action ACTION <browser|server>`,
    `$ ./bin/run generate:action postToChannel server --directory=./destinations/slack`
];
GenerateAction.flags = {
    help: command_1.flags.help({ char: 'h' }),
    force: command_1.flags.boolean({ char: 'f' }),
    title: command_1.flags.string({ char: 't', description: 'the display name of the action' }),
    directory: command_1.flags.string({ char: 'd', description: 'base directory to scaffold the action' })
};
GenerateAction.args = [
    { name: 'name', description: 'the action name', required: true },
    { name: 'type', description: 'the type of action (browser, server)', required: true }
];
//# sourceMappingURL=action.js.map