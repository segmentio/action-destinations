"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const command_1 = require("@oclif/command");
const child_process_1 = require("child_process");
const prompt_1 = require("../lib/prompt");
const chalk_1 = tslib_1.__importDefault(require("chalk"));
const chokidar_1 = tslib_1.__importDefault(require("chokidar"));
const ora_1 = tslib_1.__importDefault(require("ora"));
const path_1 = tslib_1.__importDefault(require("path"));
const globby_1 = tslib_1.__importDefault(require("globby"));
const ws_1 = require("ws");
class Serve extends command_1.Command {
    constructor() {
        super(...arguments);
        this.spinner = ora_1.default();
    }
    async run() {
        var _a;
        const { argv, flags } = this.parse(Serve);
        let destinationName = flags.destination;
        if (!destinationName) {
            const integrationsGlob = `${flags.directory}/*`;
            const integrationDirs = await globby_1.default(integrationsGlob, {
                expandDirectories: false,
                onlyDirectories: true,
                gitignore: true,
                ignore: ['node_modules']
            });
            const { selectedDestination } = await prompt_1.autoPrompt(flags, {
                type: 'select',
                name: 'selectedDestination',
                message: 'Which destination?',
                choices: integrationDirs.map((integrationPath) => {
                    const [name] = integrationPath.split(path_1.default.sep).reverse();
                    return {
                        title: name,
                        value: { name }
                    };
                })
            });
            if (selectedDestination) {
                destinationName = selectedDestination.name;
            }
        }
        if (!destinationName) {
            this.warn('You must select a destination. Exiting.');
            this.exit();
        }
        const folderPath = path_1.default.join(process.cwd(), flags.directory, destinationName);
        let child = null;
        const watcher = chokidar_1.default.watch(folderPath, {
            cwd: process.cwd()
        });
        const DEFAULT_PORT = 3000;
        const port = parseInt((_a = process.env.PORT) !== null && _a !== void 0 ? _a : '', 10) || DEFAULT_PORT;
        const wss = new ws_1.WebSocketServer({ port: port + 1 });
        wss.on('connection', function connection(ws) {
            watcher.on('change', () => {
                ws.send('change');
            });
        });
        const start = () => {
            child = child_process_1.fork(require.resolve('../lib/server.ts'), {
                cwd: process.cwd(),
                env: {
                    ...process.env,
                    DESTINATION: destinationName,
                    DIRECTORY: flags.directory,
                    TS_NODE_PROJECT: require.resolve('../../tsconfig.json')
                },
                execArgv: [
                    '-r',
                    'ts-node/register/transpile-only',
                    '-r',
                    'tsconfig-paths/register',
                    '-r',
                    'dotenv/config',
                    ...argv
                ]
            });
            child.once('exit', (code) => {
                if (!child.respawn)
                    process.exit(code);
                child === null || child === void 0 ? void 0 : child.removeAllListeners();
                child = undefined;
            });
        };
        watcher.on('change', (file) => {
            this.log(chalk_1.default.greenBright `Restarting... ${file} has been modified`);
            if (child) {
                child.on('exit', start);
                stop(child);
            }
            else {
                start();
            }
        });
        watcher.on('error', (error) => {
            this.error(`Error: ${error.message}`);
        });
        watcher.once('ready', () => {
            this.log(chalk_1.default.greenBright `Watching required files for changes .. `);
            this.log(chalk_1.default.greenBright `Visit https://app.segment.com/dev-center/actions-tester to preview your integration.`);
        });
        start();
    }
    async catch(error) {
        var _a;
        if ((_a = this.spinner) === null || _a === void 0 ? void 0 : _a.isSpinning) {
            this.spinner.fail();
        }
        throw error;
    }
}
exports.default = Serve;
Serve.description = `Starts a local development server to test your integration.`;
Serve.examples = [`$ ./bin/run serve`, `$ PORT=3001 ./bin/run serve`, `$ ./bin/run serve --destination=slack`];
Serve.strict = false;
Serve.args = [];
Serve.flags = {
    help: command_1.flags.help({ char: 'h' }),
    destination: command_1.flags.string({
        char: 'd',
        description: 'destination to serve'
    }),
    directory: command_1.flags.string({
        char: 'b',
        description: 'destination actions directory',
        default: './packages/destination-actions/src/destinations'
    })
};
function stop(process) {
    if (process) {
        process.respawn = true;
        process.kill('SIGTERM');
    }
}
//# sourceMappingURL=serve.js.map