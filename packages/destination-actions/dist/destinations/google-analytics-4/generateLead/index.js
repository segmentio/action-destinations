"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const actions_core_1 = require("@segment/actions-core");
const constants_1 = require("../constants");
const ga4_properties_1 = require("../ga4-properties");
const action = {
    title: 'Generate Lead',
    description: 'Send event when a user submits a form or request for information',
    defaultSubscription: 'type = "track"',
    fields: {
        client_id: { ...ga4_properties_1.client_id },
        user_id: { ...ga4_properties_1.user_id },
        currency: { ...ga4_properties_1.currency },
        value: { ...ga4_properties_1.value },
        params: ga4_properties_1.params
    },
    perform: (request, { payload }) => {
        if (payload.currency && !constants_1.CURRENCY_ISO_CODES.includes(payload.currency)) {
            throw new actions_core_1.IntegrationError(`${payload.currency} is not a valid currency code.`, 'Incorrect value format', 400);
        }
        if (payload.value && payload.currency === undefined) {
            throw new actions_core_1.IntegrationError('Currency is required if value is set.', 'Misconfigured required field', 400);
        }
        return request('https://www.google-analytics.com/mp/collect', {
            method: 'POST',
            json: {
                client_id: payload.client_id,
                user_id: payload.user_id,
                events: [
                    {
                        name: 'generate_lead',
                        params: {
                            currency: payload.currency,
                            value: payload.value,
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