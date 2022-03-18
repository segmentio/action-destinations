"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const actions_core_1 = require("@segment/actions-core");
const fb_capi_properties_1 = require("../fb-capi-properties");
const fb_capi_user_data_1 = require("../fb-capi-user-data");
const constants_1 = require("../constants");
const action = {
    title: 'Custom Event',
    description: 'Track your own custom events.',
    fields: {
        action_source: { ...fb_capi_properties_1.action_source, required: true },
        event_name: {
            label: 'Event Name',
            description: 'Send any custom event',
            type: 'string',
            required: true,
            default: {
                '@path': '$.event'
            }
        },
        event_time: { ...fb_capi_properties_1.event_time, required: true },
        user_data: fb_capi_user_data_1.user_data_field,
        custom_data: fb_capi_properties_1.custom_data,
        event_id: fb_capi_properties_1.event_id,
        event_source_url: fb_capi_properties_1.event_source_url
    },
    perform: (request, { payload, settings }) => {
        if (!payload.user_data) {
            throw new actions_core_1.IntegrationError('Must include at least one user data property', 'Misconfigured required field', 400);
        }
        if (!['email', 'website', 'phone_call', 'chat', 'physical_store', 'system_generated', 'other'].includes(payload.action_source)) {
            throw new actions_core_1.IntegrationError('Provide a valid value for the action source parameter, such as "website"', 'Misconfigured required field', 400);
        }
        return request(`https://graph.facebook.com/v${constants_1.API_VERSION}/${settings.pixelId}/events`, {
            method: 'POST',
            json: {
                data: [
                    {
                        event_name: payload.event_name,
                        event_time: payload.event_time,
                        action_source: payload.action_source,
                        event_id: payload.event_id,
                        event_source_url: payload.event_source_url,
                        user_data: fb_capi_user_data_1.hash_user_data({ user_data: payload.user_data }),
                        custom_data: payload.custom_data
                    }
                ]
            }
        });
    }
};
exports.default = action;
//# sourceMappingURL=index.js.map