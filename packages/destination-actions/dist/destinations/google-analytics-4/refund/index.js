"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const actions_core_1 = require("@segment/actions-core");
const constants_1 = require("../constants");
const ga4_properties_1 = require("../ga4-properties");
const action = {
    title: 'Refund',
    description: 'Send event when a refund is issued',
    defaultSubscription: 'type = "track" and event = "Order Refunded"',
    fields: {
        client_id: { ...ga4_properties_1.client_id },
        user_id: { ...ga4_properties_1.user_id },
        currency: { ...ga4_properties_1.currency },
        transaction_id: { ...ga4_properties_1.transaction_id, required: true },
        value: { ...ga4_properties_1.value, default: { '@path': '$.properties.total' } },
        affiliation: { ...ga4_properties_1.affiliation },
        coupon: { ...ga4_properties_1.coupon },
        shipping: { ...ga4_properties_1.shipping },
        tax: {
            label: 'Tax',
            type: 'number',
            description: 'Tax cost associated with a transaction.'
        },
        items: {
            ...ga4_properties_1.items_multi_products
        },
        params: ga4_properties_1.params
    },
    perform: (request, { payload }) => {
        if (payload.currency && !constants_1.CURRENCY_ISO_CODES.includes(payload.currency)) {
            throw new actions_core_1.IntegrationError(`${payload.currency} is not a valid currency code.`, 'Incorrect value format', 400);
        }
        if (payload.value && payload.currency === undefined) {
            throw new actions_core_1.IntegrationError('Currency is required if value is set.', 'Misconfigured required field', 400);
        }
        if (payload.currency === undefined && (!payload.items || !payload.items[0] || !payload.items[0].currency)) {
            throw new actions_core_1.IntegrationError('One of item-level currency or top-level currency is required.', 'Misconfigured required field', 400);
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
                        name: 'refund',
                        params: {
                            currency: payload.currency,
                            transaction_id: payload.transaction_id,
                            value: payload.value,
                            affiliation: payload.affiliation,
                            coupon: payload.coupon,
                            shipping: payload.shipping,
                            tax: payload.tax,
                            items: googleItems,
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