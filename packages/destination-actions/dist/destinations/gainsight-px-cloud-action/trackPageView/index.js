"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const regional_endpoints_1 = require("../regional-endpoints");
const action = {
    title: 'Track Page View',
    description: 'Send a page view event to Gainsight PX',
    defaultSubscription: 'type = "page"',
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