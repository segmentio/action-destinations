"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const actions_core_1 = require("@segment/actions-core");
const constants_1 = require("../constants");
const ga4_properties_1 = require("../ga4-properties");
const action = {
    title: 'View Item',
    description: 'Send event when a user views an item',
    defaultSubscription: 'type = "track" and event =  "Product Viewed"',
    fields: {
        client_id: { ...ga4_properties_1.client_id },
        user_id: { ...ga4_properties_1.user_id },
        currency: { ...ga4_properties_1.currency },
        value: { ...ga4_properties_1.value },
        items: {
            ...ga4_properties_1.items_single_products,
            required: true
        },
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
                return {
                    item_id: product.item_id,
                    item_name: product.item_name,
                    quantity: product.quantity,
                    affiliation: product.affiliation,
                    coupon: product.coupon,
                    discount: product.discount,
                    item_brand: product.item_brand,
                    item_category: product.item_category,
                    item_variant: product.item_variant,
                    price: product.price,
                    currency: product.currency
                };
            });
        }
        return request('https://www.google-analytics.com/mp/collect', {
            method: 'POST',
            json: {
                client_id: payload.client_id,
                user_id: payload.user_id,
                events: [
                    {
                        name: 'view_item',
                        params: {
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