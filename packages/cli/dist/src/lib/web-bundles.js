"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.build = exports.webBundles = exports.DIST_DIR = void 0;
const tslib_1 = require("tslib");
const execa_1 = tslib_1.__importDefault(require("execa"));
exports.DIST_DIR = 'packages/browser-destinations/dist/web/';
function webBundles() {
    const command = `ls ${exports.DIST_DIR}`;
    const map = {};
    const destinations = execa_1.default.commandSync(command).stdout;
    destinations.split('\n').forEach((destination) => {
        map[destination] = execa_1.default.commandSync(`ls ${exports.DIST_DIR}/${destination}`).stdout.split('\n')[0];
    });
    return map;
}
exports.webBundles = webBundles;
function build(env) {
    execa_1.default.commandSync(`rm -rf ${exports.DIST_DIR}`);
    if (env === 'production') {
        return execa_1.default.commandSync('lerna run build-web').stdout;
    }
    return execa_1.default.commandSync('lerna run build-web-stage').stdout;
}
exports.build = build;
//# sourceMappingURL=web-bundles.js.map