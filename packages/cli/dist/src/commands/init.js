"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const command_1 = require("@oclif/command");
const chalk_1 = tslib_1.__importDefault(require("chalk"));
const ora_1 = tslib_1.__importDefault(require("ora"));
const path_1 = tslib_1.__importDefault(require("path"));
const to_title_case_1 = tslib_1.__importDefault(require("to-title-case"));
const prompt_1 = require("../lib/prompt");
const slugs_1 = require("../lib/slugs");
const templates_1 = require("../lib/templates");
const types_1 = tslib_1.__importDefault(require("./generate/types"));
class Init extends command_1.Command {
    constructor() {
        super(...arguments);
        this.spinner = ora_1.default();
    }
    parseFlags() {
        return this.parse(Init);
    }
    async run() {
        const { args, flags } = this.parseFlags();
        const answers = await prompt_1.autoPrompt(flags, [
            {
                type: 'text',
                name: 'name',
                message: 'Integration name:',
                format: (val) => to_title_case_1.default(val)
            },
            {
                type: 'text',
                name: 'slug',
                initial: (prev) => slugs_1.generateSlug(`actions-${flags.name || prev}`),
                message: 'Integration slug:',
                format: (val) => slugs_1.generateSlug(val)
            },
            {
                type: 'select',
                name: 'template',
                message: 'What template do you want to use?',
                choices: [
                    {
                        title: 'Custom Auth',
                        description: 'Most "API Key" based integrations should use this.',
                        value: 'custom-auth'
                    },
                    {
                        title: 'Browser Destination',
                        description: 'Creates an Analytics JS compatible Destination.',
                        value: 'browser'
                    },
                    {
                        title: 'Basic Auth',
                        description: 'Integrations that use Basic Auth: https://tools.ietf.org/html/rfc7617',
                        value: 'basic-auth'
                    },
                    {
                        title: 'OAuth2 Auth',
                        description: 'Use for APIs that support OAuth2.',
                        value: 'oauth2-auth'
                    },
                    {
                        title: 'Minimal',
                        value: 'minimal'
                    }
                ],
                initial: 0
            }
        ]);
        const { name, slug, template } = answers;
        if (!name || !slug || !template) {
            this.exit();
        }
        let directory = answers.directory;
        if (template === 'browser' && directory === Init.flags.directory.default) {
            directory = './packages/browser-destinations/src/destinations';
        }
        const slugWithoutActions = String(slug).replace('actions-', '');
        const relativePath = path_1.default.join(directory, args.path || slugWithoutActions);
        const targetDirectory = path_1.default.join(process.cwd(), relativePath);
        const templatePath = path_1.default.join(__dirname, '../../templates/destinations', template);
        const snapshotPath = path_1.default.join(__dirname, '../../templates/actions/snapshot');
        try {
            this.spinner.start(`Creating ${chalk_1.default.bold(name)}`);
            templates_1.renderTemplates(templatePath, targetDirectory, answers);
            this.spinner.succeed(`Scaffold integration`);
        }
        catch (err) {
            this.spinner.fail(`Scaffold integration: ${chalk_1.default.red(err.message)}`);
            this.exit();
        }
        try {
            this.spinner.start(chalk_1.default `Generating types for {magenta ${slug}} destination`);
            await types_1.default.run(['--path', `${relativePath}/index.ts`]);
            this.spinner.succeed();
        }
        catch (err) {
            this.spinner.fail(chalk_1.default `Generating types for {magenta ${slug}} destination: ${err.message}`);
        }
        try {
            this.spinner.start(`Creating snapshot tests for ${chalk_1.default.bold(slug)} destination`);
            templates_1.renderTemplates(snapshotPath, targetDirectory, {
                destination: slug
            }, true);
            this.spinner.succeed(`Created snapshot tests for ${slug} destination`);
        }
        catch (err) {
            this.spinner.fail(`Snapshot test creation failed: ${chalk_1.default.red(err.message)}`);
            this.exit();
        }
        this.log(chalk_1.default.green(`Done creating "${name}" 🎉`));
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
exports.default = Init;
Init.description = `Scaffolds a new integration with a template. This does not register or deploy the integration.`;
Init.examples = [
    `$ ./bin/run init my-integration`,
    `$ ./bin/run init my-integration --directory packages/destination-actions --template basic-auth`
];
Init.flags = {
    help: command_1.flags.help({ char: 'h' }),
    directory: command_1.flags.string({
        char: 'd',
        description: 'target directory to scaffold the integration',
        default: './packages/destination-actions/src/destinations'
    }),
    name: command_1.flags.string({ char: 'n', description: 'name of the integration' }),
    slug: command_1.flags.string({ char: 's', description: 'url-friendly slug of the integration' }),
    template: command_1.flags.enum({
        char: 't',
        options: ['basic-auth', 'custom-auth', 'oauth2-auth', 'minimal'],
        description: 'the template to use to scaffold your integration'
    })
};
Init.args = [
    {
        name: 'path',
        description: 'path to scaffold the integration'
    }
];
//# sourceMappingURL=init.js.map