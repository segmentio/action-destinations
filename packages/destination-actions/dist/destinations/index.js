"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDestinationByIdOrKey = exports.getDestinationById = exports.manifest = exports.destinations = void 0;
const actions_core_1 = require("@segment/actions-core");
const path_1 = __importDefault(require("path"));
exports.destinations = {};
exports.manifest = {};
register('60f64ae3eaebd66d17d28e9f', './1plusx');
register('61aa712b857e8c85c3b5a849', './adobe-target');
register('5f7dd6d21ad74f3842b1fc47', './amplitude');
register('60f9d0d048950c356be2e4da', './braze');
register('61d7456b078e79929de4ee8c', './clevertap');
register('61f8296b7d15c30a3bbe2b76', './close');
register('61eed75ba749df7601b12186', './cordial');
register('5f7dd78fe27ce7ff2b8bfa37', './customerio');
register('61806e472cd47ea1104885fc', './facebook-conversions-api');
register('61dde0dc77eb0db0392649d3', './friendbuy');
register('61f83101210c42a28a88d240', './gainsight-px-cloud-action');
register('60ad61f9ff47a16b8fb7b5d9', './google-analytics-4');
register('60ae8b97dcb6cc52d5d0d5ab', './google-enhanced-conversions');
register('615c7438d93d9b61b1e9e192', './mixpanel');
register('61a8032ea5f157ee37a720be', './metronome');
register('620feaa207e70f6c6a765ff7', './moengage');
register('6101bf0e15772f7e12407fa9', './personas-messaging-sendgrid');
register('6116a41e2e8fc680d8daf821', './personas-messaging-twilio');
register('5f7dd8191ad74f868ab1fc48', './pipedrive');
register('61957755c4d820be968457de', './salesforce');
register('5f7dd8e302173ff732db5cc4', './slack');
register('6234b137d3b6404a64f2a0f0', './talon-one');
register('615cae349d109d6b7496a131', './tiktok-conversions');
register('602efa1f249b9a5e2bf8a813', './twilio');
register('614a3c7d791c91c41bae7599', './webhook');
register('61dc4e96894a6d7954cc6e45', './voyage');
function register(id, destinationPath) {
    const definition = require(destinationPath).default;
    const resolvedPath = require.resolve(destinationPath);
    const [directory] = path_1.default.dirname(resolvedPath).split(path_1.default.sep).reverse();
    exports.manifest[id] = {
        definition,
        directory,
        path: resolvedPath
    };
    exports.destinations[directory] = definition;
}
async function getDestinationLazy(slug) {
    const destination = await Promise.resolve().then(() => __importStar(require(`./${slug}`))).then((mod) => mod.default);
    if (!destination?.name || typeof destination?.actions !== 'object') {
        return null;
    }
    return destination;
}
async function getDestinationByPathKey(key) {
    const destination = exports.destinations[key] ?? (await getDestinationLazy(key));
    if (!destination) {
        return null;
    }
    return new actions_core_1.Destination(destination);
}
function getDestinationById(id) {
    const destination = exports.manifest[id];
    if (!destination?.definition) {
        return null;
    }
    return new actions_core_1.Destination(destination.definition);
}
exports.getDestinationById = getDestinationById;
async function getDestinationByIdOrKey(idOrPathKey) {
    return getDestinationById(idOrPathKey) ?? getDestinationByPathKey(idOrPathKey);
}
exports.getDestinationByIdOrKey = getDestinationByIdOrKey;
//# sourceMappingURL=index.js.map