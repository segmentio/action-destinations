"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEndpointByRegion = exports.endpoints = void 0;
exports.endpoints = {
    DC_01: 'https://api-01.moengage.com',
    DC_02: 'https://api-02.moengage.com',
    DC_03: 'https://api-03.moengage.com'
};
function getEndpointByRegion(region) {
    return exports.endpoints[region] ?? exports.endpoints['DC_01'];
}
exports.getEndpointByRegion = getEndpointByRegion;
exports.default = exports.endpoints;
//# sourceMappingURL=regional-endpoints.js.map