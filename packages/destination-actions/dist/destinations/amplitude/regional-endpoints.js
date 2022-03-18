"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEndpointByRegion = exports.endpoints = void 0;
exports.endpoints = {
    batch: {
        north_america: 'https://api2.amplitude.com/batch',
        europe: 'https://api.eu.amplitude.com/batch'
    },
    deletions: {
        north_america: 'https://amplitude.com/api/2/deletions/users',
        europe: 'https://analytics.eu.amplitude.com/api/2/deletions/users'
    },
    httpapi: {
        north_america: 'https://api2.amplitude.com/2/httpapi',
        europe: 'https://api.eu.amplitude.com/2/httpapi'
    },
    identify: {
        north_america: 'https://api2.amplitude.com/identify',
        europe: 'https://api.eu.amplitude.com/identify'
    },
    groupidentify: {
        north_america: 'https://api2.amplitude.com/groupidentify',
        europe: 'https://api.eu.amplitude.com/groupidentify'
    },
    usermap: {
        north_america: 'https://api.amplitude.com/usermap',
        europe: 'https://api.eu.amplitude.com/usermap'
    },
    usersearch: {
        north_america: 'https://amplitude.com/api/2/usersearch',
        europe: 'https://analytics.eu.amplitude.com/api/2/usersearch'
    }
};
function getEndpointByRegion(endpoint, region) {
    return exports.endpoints[endpoint][region] ?? exports.endpoints[endpoint]['north_america'];
}
exports.getEndpointByRegion = getEndpointByRegion;
exports.default = exports.endpoints;
//# sourceMappingURL=regional-endpoints.js.map