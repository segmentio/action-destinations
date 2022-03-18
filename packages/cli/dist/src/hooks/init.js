"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("@oclif/config");
const path_1 = require("path");
const hook = async function ({ config }) {
    if (process.env.NODE_ENV === 'test') {
        return;
    }
    let cpsModule;
    try {
        cpsModule = require.resolve('@segment/control-plane-service-client');
    }
    catch (err) {
        if (err.code === 'MODULE_NOT_FOUND') {
            return;
        }
        throw err;
    }
    const cpsDir = path_1.dirname(cpsModule)
        .split('/')
        .slice(0, -1)
        .join('/');
    const plugin = new config_1.Plugin({
        type: 'user',
        name: '@segment/actions-cli-internal',
        root: cpsDir
    });
    await plugin.load();
    config.plugins.push(plugin);
};
exports.default = hook;
//# sourceMappingURL=init.js.map