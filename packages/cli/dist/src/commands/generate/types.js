"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const command_1 = require("@oclif/command");
const actions_core_1 = require("@segment/actions-core");
const chokidar_1 = tslib_1.__importDefault(require("chokidar"));
const fs_extra_1 = tslib_1.__importDefault(require("fs-extra"));
const globby_1 = tslib_1.__importDefault(require("globby"));
const json_schema_to_typescript_1 = require("json-schema-to-typescript");
const path_1 = tslib_1.__importDefault(require("path"));
const prettier_1 = tslib_1.__importDefault(require("prettier"));
const destinations_1 = require("../../lib/destinations");
const constants_1 = require("../../constants");
const pretterOptions = prettier_1.default.resolveConfig.sync(process.cwd());
class GenerateTypes extends command_1.Command {
    async run() {
        const { flags } = this.parse(GenerateTypes);
        const globs = flags.path || ['./packages/*/src/destinations/*/index.ts'];
        const files = await globby_1.default(globs, {
            expandDirectories: false,
            gitignore: true,
            ignore: ['node_modules']
        });
        for (const file of files) {
            await this.handleFile(file);
        }
        if (flags.watch) {
            const dirsToWatch = files.map((file) => path_1.default.dirname(file));
            const watcher = chokidar_1.default.watch(dirsToWatch, {
                cwd: process.cwd(),
                ignored: '**/*/generated-types.ts'
            });
            watcher.on('change', (filePath) => {
                this.debug(`Regenerating types for ${filePath} ..`);
                const parentDir = dirsToWatch.find((parent) => {
                    const relative = path_1.default.relative(parent, filePath);
                    return relative && !relative.startsWith('..') && !path_1.default.isAbsolute(relative);
                });
                if (!parentDir) {
                    return;
                }
                this.handleFile(parentDir).catch((error) => {
                    this.debug(`Error generating types for ${filePath}: ${error.message}`);
                });
            });
            watcher.on('error', (error) => {
                this.error(`Error: ${error.message}`);
            });
            watcher.once('ready', () => {
                this.log('Watching files for changes ..');
            });
        }
    }
    async handleFile(file) {
        var _a;
        const destination = await destinations_1.loadDestination(file).catch((error) => {
            this.debug(`Couldn't load ${file}: ${error.message}`);
            return null;
        });
        if (!destination) {
            return;
        }
        const stats = fs_extra_1.default.statSync(file);
        const parentDir = stats.isDirectory() ? file : path_1.default.dirname(file);
        const settings = {
            ...destination.settings,
            ...(_a = destination.authentication) === null || _a === void 0 ? void 0 : _a.fields
        };
        if (settings && destinations_1.hasOauthAuthentication(destination)) {
            for (const key in settings) {
                if (constants_1.RESERVED_FIELD_NAMES.includes(key.toLowerCase())) {
                    throw new Error(`Field definition in destination ${destination.name} is using a reserved name: ${key}`);
                }
            }
        }
        const types = await generateTypes(settings, 'Settings');
        fs_extra_1.default.writeFileSync(path_1.default.join(parentDir, './generated-types.ts'), types);
        for (const [slug, action] of Object.entries(destination.actions)) {
            const types = await generateTypes(action.fields, 'Payload');
            if (fs_extra_1.default.pathExistsSync(path_1.default.join(parentDir, `${slug}`))) {
                fs_extra_1.default.writeFileSync(path_1.default.join(parentDir, slug, 'generated-types.ts'), types);
            }
            else {
                fs_extra_1.default.writeFileSync(path_1.default.join(parentDir, `./${slug}.types.ts`), types);
            }
        }
    }
}
exports.default = GenerateTypes;
GenerateTypes.description = `Generates TypeScript definitions for an integration.`;
GenerateTypes.examples = [
    `$ ./bin/run generate:types`,
    `$ ./bin/run generate:types --path ./packages/*/src/destinations/*/index.ts`
];
GenerateTypes.strict = false;
GenerateTypes.flags = {
    help: command_1.flags.help({ char: 'h' }),
    path: command_1.flags.string({
        char: 'p',
        description: 'file path for the integration(s). Accepts glob patterns.',
        multiple: true
    }),
    watch: command_1.flags.boolean({ char: 'w', description: 'Watch for file changes to regenerate types' })
};
GenerateTypes.args = [];
async function generateTypes(fields = {}, name) {
    const schema = prepareSchema(fields);
    return json_schema_to_typescript_1.compile(schema, name, {
        bannerComment: '// Generated file. DO NOT MODIFY IT BY HAND.',
        style: pretterOptions !== null && pretterOptions !== void 0 ? pretterOptions : undefined
    });
}
function prepareSchema(fields) {
    let schema = actions_core_1.fieldsToJsonSchema(fields, { tsType: true });
    schema = removeExtra(schema);
    return schema;
}
function removeExtra(schema) {
    const copy = { ...schema };
    delete copy.title;
    delete copy.enum;
    if (copy.type === 'object' && copy.properties) {
        for (const [key, property] of Object.entries(copy.properties)) {
            copy.properties[key] = removeExtra(property);
        }
    }
    else if (copy.type === 'array' && copy.items) {
        copy.items = removeExtra(copy.items);
    }
    return copy;
}
//# sourceMappingURL=types.js.map