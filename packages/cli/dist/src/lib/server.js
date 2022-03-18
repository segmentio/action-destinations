"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const express_1 = tslib_1.__importDefault(require("express"));
const cors_1 = tslib_1.__importDefault(require("cors"));
const http_1 = tslib_1.__importDefault(require("http"));
const lodash_1 = require("lodash");
const logger_1 = tslib_1.__importDefault(require("./logger"));
const path_1 = tslib_1.__importDefault(require("path"));
const destinations_1 = require("./destinations");
const actions_core_1 = require("@segment/actions-core");
const async_handler_1 = tslib_1.__importDefault(require("./async-handler"));
const summarize_http_1 = tslib_1.__importDefault(require("./summarize-http"));
const marshalError = (err) => {
    var _a, _b, _c, _d, _e;
    const error = err;
    let statusCode = (_a = error === null || error === void 0 ? void 0 : error.status) !== null && _a !== void 0 ? _a : 500;
    let msg = error === null || error === void 0 ? void 0 : error.message;
    let fields;
    if (error.name === 'AggregateAjvError') {
        fields = {};
        const ajvErr = error;
        for (const fieldError of ajvErr) {
            const name = fieldError.path.replace('$.', '');
            fields[name] = fieldError.message;
        }
    }
    if (err instanceof actions_core_1.HTTPError) {
        statusCode = (_c = (_b = err.response) === null || _b === void 0 ? void 0 : _b.status) !== null && _c !== void 0 ? _c : statusCode;
        msg = (_d = err.response.data) !== null && _d !== void 0 ? _d : err.response.content;
    }
    return { statusCode, message: msg, stack: (_e = err.stack) === null || _e === void 0 ? void 0 : _e.split('\n'), fields, requestError: true };
};
const app = express_1.default();
app.use(express_1.default.json());
app.use(cors_1.default({
    origin: [
        'https://app.segment.com',
        'https://eu1.app.segment.com',
        'https://app.segment.build',
        'https://eu1.app.segment.build',
        'http://localhost:8000'
    ]
}));
const DEFAULT_PORT = 3000;
const port = parseInt((_a = process.env.PORT) !== null && _a !== void 0 ? _a : '', 10) || DEFAULT_PORT;
const server = http_1.default.createServer(app);
const destinationSlug = process.env.DESTINATION;
const directory = process.env.DIRECTORY;
const targetDirectory = path_1.default.join(process.cwd(), directory, destinationSlug, 'index.ts');
const gracefulShutdown = lodash_1.once((exitCode) => {
    logger_1.default.info('Server stopping...');
    if (server) {
        server.close(() => {
            logger_1.default.info('Server stopped');
            setTimeout(() => process.exit(exitCode), 300);
        });
    }
    setTimeout(() => {
        logger_1.default.crit('Forcibly shutting down');
        setTimeout(() => process.exit(1), 300);
    }, 8000);
});
function handleUncaught(error, crashType) {
    error.crashType = crashType;
    logger_1.default.crit('😱  Server crashed', error);
    gracefulShutdown(1);
}
process.on('uncaughtException', (error) => {
    handleUncaught(error, 'uncaughtException');
});
process.on('unhandledRejection', (error) => {
    handleUncaught(error, 'unhandledRejection');
});
process.on('SIGINT', () => gracefulShutdown(0));
server.on('error', (err) => {
    logger_1.default.error(`Server error: ${err.message}`, err);
});
app.use((req, res, next) => {
    const requestStartedAt = process.hrtime.bigint();
    const routePath = req.path;
    const endpoint = `${req.method} ${routePath}`;
    const afterResponse = () => {
        res.removeListener('finish', afterResponse);
        res.removeListener('close', afterResponse);
        const requestEndedAt = process.hrtime.bigint();
        const duration = Number(requestEndedAt - requestStartedAt) / 1000000;
        const statusCode = res.statusCode;
        if (statusCode >= 500) {
            logger_1.default.error(`🚨  ${statusCode} ${endpoint} - ${Math.round(duration)}ms`);
        }
        else {
            logger_1.default.info(`💬  ${statusCode} ${endpoint} - ${Math.round(duration)}ms`);
        }
    };
    res.once('finish', afterResponse);
    res.once('close', afterResponse);
    next();
});
function setupRoutes(def) {
    const destination = new actions_core_1.Destination(def);
    const supportsDelete = destination.onDelete;
    const router = express_1.default.Router();
    router.get('/manifest', async_handler_1.default(async (_, res) => {
        res.json(destination.definition);
    }));
    if (supportsDelete) {
        router.post('/delete', async_handler_1.default(async (req, res) => {
            var _a, _b;
            try {
                if (destination.onDelete) {
                    await destination.onDelete((_a = req.body.payload) !== null && _a !== void 0 ? _a : {}, (_b = req.body.settings) !== null && _b !== void 0 ? _b : {});
                }
                const debug = await summarize_http_1.default(destination.responses);
                return res.status(200).json(debug);
            }
            catch (err) {
                const output = marshalError(err);
                return res.status(200).json([output]);
            }
        }));
    }
    router.post('/authenticate', async_handler_1.default(async (req, res) => {
        try {
            await destination.testAuthentication(req.body);
            res.status(200).json({ ok: true });
        }
        catch (e) {
            const error = e;
            const fields = {};
            if (error.name === 'AggregateAjvError') {
                const ajvErr = error;
                for (const fieldError of ajvErr) {
                    const name = fieldError.path.replace('$.', '');
                    fields[name] = fieldError.message;
                }
            }
            res.status(200).json({
                ok: false,
                error: error.message,
                fields
            });
        }
    }));
    for (const actionSlug of Object.keys(destination.actions)) {
        router.post(`/${actionSlug}`, async_handler_1.default(async (req, res) => {
            try {
                const action = destination.actions[actionSlug];
                if (!action) {
                    const msg = `${destination.name} action '${actionSlug}' is invalid or not found`;
                    return res.status(400).send(msg);
                }
                const eventParams = {
                    data: req.body.payload || {},
                    settings: req.body.settings || {},
                    mapping: req.body.mapping || req.body.payload || {},
                    auth: req.body.auth || {}
                };
                if (Array.isArray(eventParams.data)) {
                    eventParams.mapping = eventParams.data[0] || {};
                    await action.executeBatch(eventParams);
                }
                else {
                    await action.execute(eventParams);
                }
                const debug = await summarize_http_1.default(destination.responses);
                return res.status(200).json(debug);
            }
            catch (err) {
                const output = marshalError(err);
                return res.status(200).json([output]);
            }
        }));
    }
    app.use(router);
    const routes = [];
    for (const r of router.stack) {
        for (const [m, enabled] of Object.entries(r.route.methods)) {
            if (enabled && r.route.path !== '/manifest') {
                routes.push(`  ${m.toUpperCase()} ${r.route.path}`);
            }
        }
    }
    server.listen(port, '127.0.0.1', () => {
        logger_1.default.info(`Listening at http://localhost:${port} -> \n${routes.join('\n')}`);
    });
}
destinations_1.loadDestination(targetDirectory)
    .then(setupRoutes)
    .catch((error) => {
    logger_1.default.error(`There was an issue booting up the development server:\n\n ${error.message}`);
});
//# sourceMappingURL=server.js.map