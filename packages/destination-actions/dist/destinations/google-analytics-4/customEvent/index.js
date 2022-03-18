"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ga4_properties_1 = require("../ga4-properties");
const normalizeEventName = (name, lowercase) => {
    name = name.trim();
    name = name.replace(/\s/g, '_');
    if (lowercase) {
        name = name.toLowerCase();
    }
    return name;
};
const action = {
    title: 'Custom Event',
    description: 'Send any custom event',
    defaultSubscription: 'type = "track"',
    fields: {
        clientId: { ...ga4_properties_1.client_id },
        user_id: { ...ga4_properties_1.user_id },
        name: {
            label: 'Event Name',
            description: 'The unique name of the custom event created in GA4. GA4 does not accept spaces in event names so Segment will replace any spaces with underscores. More information about GA4 event name rules is available in [their docs](https://support.google.com/analytics/answer/10085872?hl=en&ref_topic=9756175#event-name-rules&zippy=%2Cin-this-article.%2Cin-this-article).',
            type: 'string',
            required: true,
            default: {
                '@path': '$.event'
            }
        },
        lowercase: {
            label: 'Lowercase Event Name',
            description: 'If true, the event name will be converted to lowercase before sending to Google. Event names are case sensitive in GA4 so enable this setting to avoid distinct events for casing differences. More information about GA4 event name rules is available in [their docs](https://support.google.com/analytics/answer/10085872?hl=en&ref_topic=9756175#event-name-rules&zippy=%2Cin-this-article.%2Cin-this-article).',
            type: 'boolean',
            default: false
        },
        params: { ...ga4_properties_1.params }
    },
    perform: (request, { payload }) => {
        const event_name = normalizeEventName(payload.name, payload.lowercase);
        return request('https://www.google-analytics.com/mp/collect', {
            method: 'POST',
            json: {
                client_id: payload.clientId,
                user_id: payload.user_id,
                events: [
                    {
                        name: event_name,
                        params: payload.params
                    }
                ]
            }
        });
    }
};
exports.default = action;
//# sourceMappingURL=index.js.map