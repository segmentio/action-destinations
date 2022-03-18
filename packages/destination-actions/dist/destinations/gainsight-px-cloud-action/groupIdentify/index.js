"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const regional_endpoints_1 = require("../regional-endpoints");
const action = {
    title: 'Group Identify User',
    description: 'Updates or adds properties to an account. The account is created if it does not exist.',
    defaultSubscription: 'type = "group"',
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