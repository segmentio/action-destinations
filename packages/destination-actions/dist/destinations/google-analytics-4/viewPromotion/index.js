"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const actions_core_1 = require("@segment/actions-core");
const constants_1 = require("../constants");
const ga4_properties_1 = require("../ga4-properties");
const action = {
    title: 'View Promotion',
    description: 'Send event when a promotion is shown to a user',
    defaultSubscription: 'type = "track" and event = "Promotion Viewed"',
    fields: {
        client_id: { ...ga4_properties_1.client_id },
        user_id: { ...ga4_properties_1.user_id },
        creative_name: { ...ga4_properties_1.creative_name },
        creative_slot: { ...ga4_properties_1.creative_slot, default: { '@path': '$.properties.creative' } },
        location_id: {
            label: 'Location ID',
            type: 'string',
            description: 'The ID of the location.',
            default: {
                '@path': '$.properties.position'
            }
        },
        promotion_id: { ...ga4_properties_1.promotion_id, default: { '@path': '$.properties.promotion_id' } },
        promotion_name: { ...ga4_properties_1.promotion_name, default: { '@path': '$.properties.name' } },
        items: {
            ...ga4_properties_1.items_single_products,
            required: true,
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
                    throw new actions_core_1.IntegrationError('One of item id or item name is required.', 'Misconfigured required field', 400);
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
                        name: 'view_promotion',
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