"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ga4_properties_1 = require("../ga4-properties");
const action = {
    title: 'Search',
    description: 'Send event when a user searches your content',
    defaultSubscription: 'type = "track" and event = "Products Searched"',
    fields: {
        client_id: { ...ga4_properties_1.client_id },
        user_id: { ...ga4_properties_1.user_id },
        search_term: {
            label: 'Search Term',
            type: 'string',
            description: 'The term that was searched for.',
            required: true,
            default: {
                '@path': `$.properties.query`
            }
        },
        params: ga4_properties_1.params
    },
    perform: (request, { payload }) => {
        return request('https://www.google-analytics.com/mp/collect', {
            method: 'POST',
            json: {
                client_id: payload.client_id,
                user_id: payload.user_id,
                events: [
                    {
                        name: 'search',
                        params: {
                            search_term: payload.search_term,
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