"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cloudUtil_1 = require("../cloudUtil");
const actions_shared_1 = require("@segment/actions-shared");
const actions_shared_2 = require("@segment/actions-shared");
const actions_shared_3 = require("@segment/actions-shared");
const actions_shared_4 = require("@segment/actions-shared");
const cloudTrackCustomEventFields = { ...actions_shared_3.trackCustomEventFields({ requireEmail: true }), ...actions_shared_1.contextFields };
const trackCustomEventMapi = {
    fields: {
        eventType: actions_shared_2.COPY,
        deduplicationId: actions_shared_2.COPY,
        coupon: { name: 'couponCode' },
        attributionId: actions_shared_2.COPY,
        referralCode: actions_shared_2.COPY,
        email: actions_shared_2.COPY,
        firstName: actions_shared_2.COPY,
        lastName: actions_shared_2.COPY,
        isNewCustomer: actions_shared_2.COPY,
        ipAddress: actions_shared_2.COPY,
        userAgent: actions_shared_2.COPY,
        pageUrl: actions_shared_2.DROP,
        pageTitle: actions_shared_2.DROP
    },
    unmappedFieldObject: 'additionalProperties'
};
const action = {
    title: 'Track Custom Event',
    description: 'Record when a customer completes any custom event that you define.',
    fields: cloudTrackCustomEventFields,
    perform: async (request, { settings, payload }) => {
        const payload1 = actions_shared_4.moveEventPropertiesToRoot(payload);
        const friendbuyPayload = actions_shared_2.mapEvent(trackCustomEventMapi, payload1);
        const [requestUrl, requestParams] = await cloudUtil_1.createMapiRequest('v1/event/custom', request, settings, friendbuyPayload);
        return request(requestUrl, requestParams);
    }
};
exports.default = action;
//# sourceMappingURL=index.js.map