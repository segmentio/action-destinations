"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cloudUtil_1 = require("../cloudUtil");
const actions_shared_1 = require("@segment/actions-shared");
const actions_shared_2 = require("@segment/actions-shared");
const actions_shared_3 = require("@segment/actions-shared");
const actions_shared_4 = require("@segment/actions-shared");
const cloudTrackCustomerFields = { ...actions_shared_3.trackCustomerFields, ...actions_shared_1.contextFields };
const trackCustomerMapi = {
    fields: {
        customerId: { convert: actions_shared_4.enjoinString },
        email: actions_shared_2.COPY,
        isNewCustomer: actions_shared_2.COPY,
        loyaltyStatus: actions_shared_2.COPY,
        category: actions_shared_2.COPY,
        firstName: actions_shared_2.COPY,
        lastName: actions_shared_2.COPY,
        gender: actions_shared_2.COPY,
        age: { convert: actions_shared_4.enjoinInteger },
        birthday: { convert: actions_shared_4.parseDate },
        language: actions_shared_2.COPY,
        timezone: actions_shared_2.COPY,
        addressCountry: { name: 'country' },
        addressState: { name: 'state' },
        addressCity: { name: 'city' },
        addressPostalCode: { name: 'zipCode', convert: actions_shared_4.enjoinString },
        ipAddress: actions_shared_2.COPY,
        userAgent: actions_shared_2.COPY,
        pageUrl: actions_shared_2.DROP,
        pageTitle: actions_shared_2.DROP
    },
    unmappedFieldObject: 'additionalProperties'
};
const action = {
    title: 'Track Customer',
    description: 'Create a new customer profile or update an existing customer profile.',
    fields: cloudTrackCustomerFields,
    perform: async (request, { settings, payload }) => {
        const friendbuyPayload = actions_shared_2.mapEvent(trackCustomerMapi, payload);
        const [requestUrl, requestParams] = await cloudUtil_1.createMapiRequest('v1/customer', request, settings, friendbuyPayload);
        return request(requestUrl, requestParams);
    }
};
exports.default = action;
//# sourceMappingURL=index.js.map