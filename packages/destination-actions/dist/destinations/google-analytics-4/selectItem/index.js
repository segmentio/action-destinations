"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const actions_core_1 = require("@segment/actions-core");
const constants_1 = require("../constants");
const ga4_properties_1 = require("../ga4-properties");
const action = {
    title: 'Select Item',
    description: 'Send event when a user selects an item from a list',
    defaultSubscription: 'type = "track" and event = "Product Clicked"',
    fields: {
        client_id: { ...ga4_properties_1.client_id },
        user_id: { ...ga4_properties_1.user_id },
        item_list_name: {
            label: 'Item List Name',
            description: 'The name of the list in which the item was presented to the user.',
            type: 'string'
        },
        item_list_id: {
            label: 'Item List Id',
            description: 'The ID of the list in which the item was presented to the user.',
            type: 'string'
        },
        items: {
            ...ga4_properties_1.items_single_products,
            required: true
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
                        name: 'select_item',
                        params: {
                            items: googleItems,
                            item_list_name: payload.item_list_name,
                            item_list_id: payload.item_list_id,
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