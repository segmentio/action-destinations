"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cloudUtil_1 = require("../cloudUtil");
const actions_shared_1 = require("@segment/actions-shared");
const actions_shared_2 = require("@segment/actions-shared");
const actions_shared_3 = require("@segment/actions-shared");
const actions_shared_4 = require("@segment/actions-shared");
const cloudTrackPurchaseFields = { ...actions_shared_3.trackPurchaseFields({}), ...actions_shared_1.contextFields };
const trackPurchaseMapi = {
    fields: {
        orderId: { convert: actions_shared_4.enjoinString },
        amount: { convert: actions_shared_4.enjoinNumber },
        currency: actions_shared_2.COPY,
        coupon: { name: 'couponCode' },
        attributionId: actions_shared_2.COPY,
        referralCode: actions_shared_2.COPY,
        giftCardCodes: actions_shared_2.COPY,
        products: {
            type: 'array',
            defaultObject: { sku: 'unknown', name: 'unknown', quantity: 1 },
            fields: {
                sku: { convert: actions_shared_4.enjoinString },
                name: actions_shared_2.COPY,
                quantity: { convert: actions_shared_4.enjoinInteger },
                price: { convert: actions_shared_4.enjoinNumber },
                description: actions_shared_2.COPY,
                category: actions_shared_2.COPY,
                url: actions_shared_2.COPY,
                image_url: { name: 'imageUrl' }
            }
        },
        customerId: actions_shared_2.COPY,
        email: actions_shared_2.COPY,
        firstName: actions_shared_2.COPY,
        lastName: actions_shared_2.COPY,
        isNewCustomer: actions_shared_2.COPY,
        age: actions_shared_2.DROP,
        birthday: actions_shared_2.DROP,
        ipAddress: actions_shared_2.COPY,
        userAgent: actions_shared_2.COPY,
        pageUrl: actions_shared_2.DROP,
        pageTitle: actions_shared_2.DROP
    },
    unmappedFieldObject: 'additionalProperties'
};
const action = {
    title: 'Track Purchase',
    description: 'Record when a customer makes a purchase.',
    fields: cloudTrackPurchaseFields,
    perform: async (request, { settings, payload }) => {
        const friendbuyPayload = actions_shared_2.mapEvent(trackPurchaseMapi, payload);
        const [requestUrl, requestParams] = await cloudUtil_1.createMapiRequest('v1/event/purchase', request, settings, friendbuyPayload);
        return request(requestUrl, requestParams);
    }
};
exports.default = action;
//# sourceMappingURL=index.js.map