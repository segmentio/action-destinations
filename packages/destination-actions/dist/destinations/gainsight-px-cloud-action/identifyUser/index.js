"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const regional_endpoints_1 = require("../regional-endpoints");
const action = {
    title: 'Identify User',
    description: 'Set the user ID for a particular device ID or update user properties',
    defaultSubscription: 'type = "identify"',
    fields: {},
    perform: (request, { payload, settings }) => {
        return request(regional_endpoints_1.getEndpointByRegion('track', settings.dataCenter), {
            method: 'post',
            json: payload
        });
    }
};
exports.default = action;
//# sourceMappingURL=index.js.map