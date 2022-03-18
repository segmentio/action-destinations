"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hasOauthAuthentication = exports.getManifest = exports.loadDestination = void 0;
const tslib_1 = require("tslib");
const path_1 = tslib_1.__importDefault(require("path"));
const require_cache_1 = require("./require-cache");
const constants_1 = require("../constants");
async function loadDestination(filePath) {
    const importPath = path_1.default.isAbsolute(filePath) ? filePath : path_1.default.join(process.cwd(), filePath);
    require_cache_1.clearRequireCache();
    const module = require(importPath);
    const destination = module.destination || module.default;
    if (!(destination === null || destination === void 0 ? void 0 : destination.name) || typeof (destination === null || destination === void 0 ? void 0 : destination.actions) !== 'object') {
        return null;
    }
    return destination;
}
exports.loadDestination = loadDestination;
const getManifest = () => {
    const { manifest: browserManifest } = require('@segment/browser-destinations');
    const { manifest: cloudManifest } = require('@segment/action-destinations');
    const { mergeWith } = require('lodash');
    return mergeWith({}, cloudManifest, browserManifest, (objValue, srcValue) => {
        var _a, _b, _c, _d;
        if (Object.keys((_b = (_a = objValue === null || objValue === void 0 ? void 0 : objValue.definition) === null || _a === void 0 ? void 0 : _a.actions) !== null && _b !== void 0 ? _b : {}).length === 0) {
            return;
        }
        for (const [actionKey, action] of Object.entries((_d = (_c = srcValue.definition) === null || _c === void 0 ? void 0 : _c.actions) !== null && _d !== void 0 ? _d : {})) {
            if (actionKey in objValue.definition.actions) {
                throw new Error(`Could not merge browser + cloud actions because there is already an action with the same key "${actionKey}"`);
            }
            objValue.definition.actions[actionKey] = action;
        }
        return objValue;
    });
};
exports.getManifest = getManifest;
function hasOauthAuthentication(definition) {
    return ('authentication' in definition &&
        !!definition.authentication &&
        'scheme' in definition.authentication &&
        definition.authentication.scheme === constants_1.OAUTH_SCHEME);
}
exports.hasOauthAuthentication = hasOauthAuthentication;
//# sourceMappingURL=destinations.js.map