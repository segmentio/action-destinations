"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const actions_core_1 = require("@segment/actions-core");
const constants_1 = require("../constants");
const ga4_properties_1 = require("../ga4-properties");
const action = {
    title: 'Select Promotion',
    description: 'Send event when a user selects a promotion',
    defaultSubscription: 'type = "track" and event = "Promotion Clicked"',
    fields: {
        client_id: { ...ga4_properties_1.client_id },
        user_id: { ...ga4_properties_1.user_id },
        creative_name: { ...ga4_properties_1.creative_name },
        creative_slot: { ...ga4_properties_1.creative_slot, default: { '@path': '$.properties.creative' } },
        location_id: {
            label: 'Location ID',
            type: 'string',
            description: 'The ID of the location.'
        },
        promotion_id: { ...ga4_properties_1.promotion_id, default: { '@path': '$.properties.promotion_id' } },
        promotion_name: { ...ga4_properties_1.promotion_name, default: { '@path': '$.properties.name' } },
        items: {
            ...ga4_properties_1.items_single_products,
            properties: {
                ...ga4_properties_1.minimal_items.properties,
                creative_name: {
                    ...ga4_properties_1.creative_name
                },
                creative_slot: {
                    ...ga4_properties_1.creative_slot
                },
                promotion_name: {
                    ...ga4_properties_1.promotion_name
                },
                promotion_id: {
                    ...ga4_properties_1.promotion_id
                }
            }
        },
        params: ga4_properties_1.params
    },
    perform: (request, { payload }) => {
        let googleItems = [];
        if (payload.items) {
            googleItems = payload.items.map((product) => {
                if (product.item_name === undefined && product.item_id === undefined) {
                    throw new actions_core_1.IntegrationError('One of product name or product id is required for product or impression data.', 'Misconfigured required field', 400);
                }
                if (product.currency && !constants_1.CURRENCY_ISO_CODES.includes(product.currency)) {
                    throw new actions_core_1.IntegrationError(`${product.currency} is not a valid currency code.`, 'Incorrect value format', 400);
                }
                if (product.promotion_id === undefined && product.promotion_name === undefined) {
                    throw new actions_core_1.IntegrationError('One of promotion name or promotion id is required.', 'Misconfigured required field', 400);
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
                        name: 'select_promotion',
                        params: {
                            creative_name: payload.creative_name,
                            creative_slot: payload.creative_slot,
                            location_id: payload.location_id,
                            promotion_id: payload.promotion_id,
                            promotion_name: payload.promotion_name,
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