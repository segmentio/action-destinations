"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEndpointByRegion = exports.endpoints = void 0;
exports.endpoints = {
    track: {
        north_america: 'https://segment-esp.aptrinsic.com/rte/segmentio/v1/push',
        europe: 'https://segment-esp-eu.aptrinsic.com/rte/segmentio/v1/push',
        us2: 'https://segment-esp-us2.aptrinsic.com/rte/segmentio/v1/push',
    },
    batch: {
        north_america: 'https://segment-esp.aptrinsic.com/rte/segmentio/v1/batch',
        europe: 'https://segment-esp-eu.aptrinsic.com/rte/segmentio/v1/batch',
        us2: 'https://segment-esp-us2.aptrinsic.com/rte/segmentio/v1/push',
    },
};
function getEndpointByRegion(endpoint, region) {
    return exports.endpoints[endpoint][region] ?? exports.endpoints[endpoint]['north_america'];
}
exports.getEndpointByRegion = getEndpointByRegion;
exports.default = exports.endpoints;
//# sourceMappingURL=regional-endpoints.js.map