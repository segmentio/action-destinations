"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.event_id = exports.event_source_url = exports.action_source = exports.event_time = exports.num_items = exports.validateContents = exports.contents = exports.content_type = exports.content_name = exports.content_ids = exports.content_category = exports.value = exports.currency = exports.custom_data = void 0;
const actions_core_1 = require("@segment/actions-core");
exports.custom_data = {
    label: 'Custom Data',
    description: 'The custom data object which can be used to pass custom properties. See [here](https://developers.facebook.com/docs/marketing-api/conversions-api/parameters/custom-data) for more information',
    type: 'object',
    defaultObjectUI: 'keyvalue'
};
exports.currency = {
    label: 'Currency',
    description: 'The currency for the value specified.',
    type: 'string',
    default: {
        '@path': '$.properties.currency'
    }
};
exports.value = {
    label: 'Value',
    description: 'The value of a user performing this event to the business.',
    type: 'number'
};
exports.content_category = {
    label: 'Content Category',
    description: 'Category of the page/product.',
    type: 'string'
};
exports.content_ids = {
    label: 'Content IDs',
    description: 'Product IDs associated with the event, such as SKUs (e.g. ["ABC123", "XYZ789"]).',
    type: 'string',
    multiple: true
};
exports.content_name = {
    label: 'Content Name',
    description: 'Name of the page/product.',
    type: 'string'
};
exports.content_type = {
    label: 'Content Type',
    description: 'Either product or product_group based on the content_ids or contents being passed.',
    type: 'string'
};
exports.contents = {
    label: 'Contents',
    description: 'An array of JSON objects that contains the quantity and the International Article Number (EAN) when applicable, or other product or content identifier(s). id and quantity are the required fields.',
    type: 'object',
    multiple: true,
    properties: {
        id: {
            label: 'ID',
            description: 'ID of the purchased item.',
            type: 'string'
        },
        quantity: {
            label: 'Quantity',
            description: 'The number of items purchased.',
            type: 'integer'
        },
        item_price: {
            label: 'Item Price',
            description: 'The price of the item.',
            type: 'number'
        },
        delivery_category: {
            label: 'Delivery Category',
            description: 'Type of delivery for a purchase event. Supported values are "in_store", "curbside", "home_delivery".',
            type: 'string'
        }
    }
};
const validateContents = (contents) => {
    const valid_delivery_categories = ['in_store', 'curbside', 'home_delivery'];
    for (let i = 0; i < contents.length; i++) {
        const item = contents[i];
        if (!item.id) {
            return new actions_core_1.IntegrationError(`contents[${i}] must include an 'id' parameter.`, 'Misconfigured required field', 400);
        }
        if (item.delivery_category && !valid_delivery_categories.includes(item.delivery_category)) {
            return new actions_core_1.IntegrationError(`contents[${i}].delivery_category must be one of {in_store, home_delivery, curbside}.`, 'Misconfigured field', 400);
        }
    }
    return false;
};
exports.validateContents = validateContents;
exports.num_items = {
    label: 'Number of Items',
    description: 'The number of items when checkout was initiated.',
    type: 'integer'
};
exports.event_time = {
    label: 'Event Time',
    description: 'A Unix timestamp in seconds indicating when the actual event occurred.',
    type: 'string',
    default: {
        '@path': '$.timestamp'
    }
};
exports.action_source = {
    label: 'Action Source',
    description: 'This field allows you to specify where your conversions occurred.',
    type: 'string'
};
exports.event_source_url = {
    label: 'Event Source URL',
    description: 'The browser URL where the event happened. The URL must begin with http:// or https:// and should match the verified domain. event_source_url is required if action_source = “website”; however it is strongly recommended that you include it for any action_source.',
    type: 'string',
    default: {
        '@path': '$.context.page.url'
    }
};
exports.event_id = {
    label: 'Event ID',
    description: 'This ID can be any unique string chosen by the advertiser. event_id is used to deduplicate events sent by both Facebook Pixel and Conversions API.',
    type: 'string',
    default: {
        '@path': '$.messageId'
    }
};
//# sourceMappingURL=fb-capi-properties.js.map