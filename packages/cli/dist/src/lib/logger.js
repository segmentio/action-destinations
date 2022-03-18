"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ecs_logs_js_1 = require("ecs-logs-js");
const logger = new ecs_logs_js_1.Logger({
    level: process.env.LOG_LEVEL || 'debug',
    devMode: true
});
exports.default = logger;
//# sourceMappingURL=logger.js.map