"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ga4_properties_1 = require("../ga4-properties");
const action = {
    title: 'Sign Up',
    description: 'Send event when a user signs up to measure the popularity of each sign-up method',
    defaultSubscription: 'type = "track" and event = "Signed Up"',
    fields: {
        client_id: { ...ga4_properties_1.client_id },
        user_id: { ...ga4_properties_1.user_id },
        method: {
            label: 'Method',
            description: 'The method used for sign up.',
            type: 'string',
            default: {
                '@path': `$.properties.type`
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
                        name: 'sign_up',
                        params: {
                            method: payload.method,
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