"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const actions_core_1 = require("@segment/actions-core");
const fb_capi_properties_1 = require("../fb-capi-properties");
const fb_capi_user_data_1 = require("../fb-capi-user-data");
const constants_1 = require("../constants");
const action = {
    title: 'Page View',
    description: 'Send a page view event when a user lands on a page',
    defaultSubscription: 'type = "page"',
    fields: {
        action_source: { ...fb_capi_properties_1.action_source, required: true },
        event_time: { ...fb_capi_properties_1.event_time, required: true },
        user_data: fb_capi_user_data_1.user_data_field,
        event_id: fb_capi_properties_1.event_id,
        event_source_url: fb_capi_properties_1.event_source_url,
        custom_data: fb_capi_properties_1.custom_data
    },
    perform: (request, { payload, settings }) => {
        if (!payload.user_data) {
            throw new actions_core_1.IntegrationError('Must include at least one user data property', 'Misconfigured required field', 400);
        }
        if (payload.action_source === 'website' && payload.user_data.client_user_agent === undefined) {
            throw new actions_core_1.IntegrationError('If action source is "Website" then client_user_agent must be defined', 'Misconfigured required field', 400);
        }
        return request(`https://graph.facebook.com/v${constants_1.API_VERSION}/${settings.pixelId}/events`, {
            method: 'POST',
            json: {
                data: [
                    {
                        event_name: 'PageView',
                        event_time: payload.event_time,
                        action_source: payload.action_source,
                        event_source_url: payload.event_source_url,
                        event_id: payload.event_id,
                        user_data: fb_capi_user_data_1.hash_user_data({ user_data: payload.user_data })
                    }
                ]
            }
        });
    }
};
exports.default = action;
//# sourceMappingURL=index.js.map