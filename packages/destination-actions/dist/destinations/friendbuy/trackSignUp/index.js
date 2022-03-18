"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cloudUtil_1 = require("../cloudUtil");
const actions_shared_1 = require("@segment/actions-shared");
const actions_shared_2 = require("@segment/actions-shared");
const actions_shared_3 = require("@segment/actions-shared");
const actions_shared_4 = require("@segment/actions-shared");
const cloudTrackSignUpFields = {
    ...actions_shared_3.trackSignUpFields({ requireCustomerId: true, requireEmail: true }),
    ...actions_shared_1.contextFields
};
const trackSignUpMapi = {
    fields: {
        coupon: { name: 'couponCode' },
        attributionId: actions_shared_2.COPY,
        referralCode: actions_shared_2.COPY,
        customerId: { convert: actions_shared_4.enjoinString },
        email: actions_shared_2.COPY,
        isNewCustomer: actions_shared_2.COPY,
        loyaltyStatus: actions_shared_2.COPY,
        firstName: actions_shared_2.COPY,
        lastName: actions_shared_2.COPY,
        age: { convert: actions_shared_4.enjoinInteger },
        birthday: { convert: actions_shared_4.parseDate },
        ipAddress: actions_shared_2.COPY,
        userAgent: actions_shared_2.COPY,
        pageUrl: actions_shared_2.DROP,
        pageTitle: actions_shared_2.DROP
    },
    unmappedFieldObject: 'additionalProperties'
};
const action = {
    title: 'Track Sign Up',
    description: 'Record when a customer signs up for a service.',
    fields: cloudTrackSignUpFields,
    perform: async (request, { settings, payload }) => {
        const friendbuyPayload = actions_shared_2.mapEvent(trackSignUpMapi, payload);
        const [requestUrl, requestParams] = await cloudUtil_1.createMapiRequest('v1/event/account-sign-up', request, settings, friendbuyPayload);
        return request(requestUrl, requestParams);
    }
};
exports.default = action;
//# sourceMappingURL=index.js.map