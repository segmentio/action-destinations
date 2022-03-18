"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ga4_properties_1 = require("../ga4-properties");
const action = {
    title: 'Page View',
    description: 'Send page view when a user views a page',
    defaultSubscription: 'type = "page"',
    fields: {
        clientId: { ...ga4_properties_1.client_id },
        user_id: { ...ga4_properties_1.user_id },
        page_location: {
            label: 'Page Location',
            type: 'string',
            description: 'The current page URL',
            default: {
                '@path': '$.context.page.url'
            }
        },
        page_referrer: {
            label: 'Page Referrer',
            type: 'string',
            description: 'Previous page URL',
            default: {
                '@path': '$.context.page.referrer'
            }
        },
        params: ga4_properties_1.params
    },
    perform: (request, { payload }) => {
        return request('https://www.google-analytics.com/mp/collect', {
            method: 'POST',
            json: {
                client_id: payload.clientId,
                user_id: payload.user_id,
                events: [
                    {
                        name: 'page_view',
                        params: {
                            page_location: payload.page_location,
                            page_referrer: payload.page_referrer,
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