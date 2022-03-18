"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const actions_core_1 = require("@segment/actions-core");
const constants_1 = require("../constants");
const ga4_properties_1 = require("../ga4-properties");
const action = {
    title: 'Begin Checkout',
    description: 'Send event when a user begins checkout',
    defaultSubscription: 'type = "track" and event = "Checkout Started"',
    fields: {
        client_id: { ...ga4_properties_1.client_id },
        user_id: { ...ga4_properties_1.user_id },
        coupon: { ...ga4_properties_1.coupon, default: { '@path': '$.properties.coupon' } },
        currency: { ...ga4_properties_1.currency },
        items: {
            ...ga4_properties_1.items_multi_products,
            required: true
        },
        value: { ...ga4_properties_1.value },
        params: ga4_properties_1.params
    },
    perform: (request, { payload }) => {
        if (payload.currency && !constants_1.CURRENCY_ISO_CODES.includes(payload.currency)) {
            throw new actions_core_1.IntegrationError(`${payload.currency} is not a valid currency code.`, 'Incorrect value format', 400);
        }
        let googleItems = [];
        if (payload.items) {
            googleItems = payload.items.map((product) => {
                if (product.item_name === undefined && product.item_id === undefined) {
                    throw new actions_core_1.IntegrationError('One of product name or product id is required for product or impression data.', 'Misconfigured required field', 400);
                }
                if (product.currency && !constants_1.CURRENCY_ISO_CODES.includes(product.currency)) {
                    throw new actions_core_1.IntegrationError(`${product.currency} is not a valid currency code.`, 'Incorrect value format', 400);
                }
                return product;
            });
        }
        return request('https://www.google-analytics.com/mp/collect', {
            method: 'POST',
            json: {
                client_id: payload.client_id,
                user_id: payload.user_id,
                events: [
                    {
                        name: 'begin_checkout',
                        params: {
                            coupon: payload.coupon,
                            currency: payload.currency,
                            items: googleItems,
                            value: payload.value,
                            ...payload.params
                        }
                    }
                ]
            }
        });
    }
};
exports.default = action;
//# sourceMappingURL=index.js.map