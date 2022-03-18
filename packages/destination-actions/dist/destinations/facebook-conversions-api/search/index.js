"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const actions_core_1 = require("@segment/actions-core");
const constants_1 = require("../constants");
const fb_capi_properties_1 = require("../fb-capi-properties");
const fb_capi_user_data_1 = require("../fb-capi-user-data");
const action = {
    title: 'Search',
    description: 'Send event when a user searches content or products',
    defaultSubscription: 'type = "track" and event = "Products Searched"',
    fields: {
        action_source: { ...fb_capi_properties_1.action_source, required: true },
        event_time: { ...fb_capi_properties_1.event_time, required: true },
        user_data: fb_capi_user_data_1.user_data_field,
        content_category: fb_capi_properties_1.content_category,
        content_ids: fb_capi_properties_1.content_ids,
        contents: {
            ...fb_capi_properties_1.contents,
            default: {
                '@arrayPath': [
                    '$.properties',
                    {
                        id: {
                            '@path': '$.product_id'
                        },
                        quantity: {
                            '@path': '$.quantity'
                        },
                        item_price: {
                            '@path': '$.price'
                        }
                    }
                ]
            }
        },
        currency: fb_capi_properties_1.currency,
        event_id: fb_capi_properties_1.event_id,
        event_source_url: fb_capi_properties_1.event_source_url,
        search_string: {
            label: 'Search String',
            description: 'A search query made by a user. This must be a string.',
            type: 'string',
            default: {
                '@path': '$.properties.query'
            }
        },
        value: fb_capi_properties_1.value,
        custom_data: fb_capi_properties_1.custom_data
    },
    perform: (request, { payload, settings }) => {
        if (payload.currency && !constants_1.CURRENCY_ISO_CODES.has(payload.currency)) {
            throw new actions_core_1.IntegrationError(`${payload.currency} is not a valid currency code.`, 'Misconfigured required field', 400);
        }
        if (!payload.user_data) {
            throw new actions_core_1.IntegrationError('Must include at least one user data property', 'Misconfigured required field', 400);
        }
        if (payload.action_source === 'website' && payload.user_data.client_user_agent === undefined) {
            throw new actions_core_1.IntegrationError('If action source is "Website" then client_user_agent must be defined', 'Misconfigured required field', 400);
        }
        if (payload.contents) {
            const err = fb_capi_properties_1.validateContents(payload.contents);
            if (err)
                throw err;
        }
        return request(`https://graph.facebook.com/v${constants_1.API_VERSION}/${settings.pixelId}/events`, {
            method: 'POST',
            json: {
                data: [
                    {
                        event_name: 'Search',
                        event_time: payload.event_time,
                        action_source: payload.action_source,
                        event_id: payload.event_id,
                        event_source_url: payload.event_source_url,
                        user_data: fb_capi_user_data_1.hash_user_data({ user_data: payload.user_data }),
                        custom_data: {
                            ...payload.custom_data,
                            currency: payload.currency,
                            content_ids: payload.content_ids,
                            contents: payload.contents,
                            content_category: payload.content_category,
                            value: payload.value,
                            search_string: payload.search_string
                        }
                    }
                ]
            }
        });
    }
};
exports.default = action;
//# sourceMappingURL=index.js.map