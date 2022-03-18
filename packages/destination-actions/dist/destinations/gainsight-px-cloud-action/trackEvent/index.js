"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const regional_endpoints_1 = require("../regional-endpoints");
const action = {
    title: 'Track Event',
    description: 'Send an event to Gainsight PX',
    defaultSubscription: 'type = "track"',
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