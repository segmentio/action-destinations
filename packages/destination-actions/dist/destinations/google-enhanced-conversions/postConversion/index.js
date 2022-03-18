"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const actions_core_1 = require("@segment/actions-core");
const formatter_1 = require("./formatter");
const action = {
    title: 'Post Conversion',
    description: 'Send a conversion event to Google Ads.',
    fields: {
        conversion_label: {
            label: 'Conversion Label',
            description: 'The Google Ads conversion label. You can find it in your Google Ads account using the instructions in the article [Google Ads conversions](https://support.google.com/tagmanager/answer/6105160?hl=en).',
            type: 'string',
            required: true,
            default: ''
        },
        email: {
            label: 'Email',
            description: 'Email address of the individual who triggered the conversion event.',
            type: 'string',
            required: true,
            format: 'email',
            default: {
                '@if': {
                    exists: { '@path': '$.properties.email' },
                    then: { '@path': '$.properties.email' },
                    else: { '@path': '$.traits.email' }
                }
            }
        },
        transaction_id: {
            label: 'Order ID',
            description: 'Order ID or Transaction ID of the conversion event. Google requires an Order ID even if the event is not an ecommerce event. Learn more in the article [Use a transaction ID to minimize duplicate conversions](https://support.google.com/google-ads/answer/6386790?hl=en&ref_topic=3165803).',
            type: 'string',
            required: true,
            default: {
                '@path': '$.properties.orderId'
            }
        },
        user_agent: {
            label: 'User Agent',
            description: 'User agent of the individual who triggered the conversion event. This should match the user agent of the request that sent the original conversion so the conversion and its enhancement are either both attributed as same-device or both attributed as cross-device. This field is optional but recommended.',
            type: 'string',
            default: {
                '@path': '$.context.userAgent'
            }
        },
        conversion_time: {
            label: 'Conversion Time',
            description: 'Timestamp of the conversion event.',
            type: 'datetime',
            required: true,
            default: {
                '@path': '$.timestamp'
            }
        },
        value: {
            label: 'Value',
            description: 'The monetary value attributed to the conversion event.',
            type: 'number',
            default: {
                '@path': '$.properties.total'
            }
        },
        currency_code: {
            label: 'Currency Code',
            description: 'Currency of the purchase or items associated with the conversion event, in 3-letter ISO 4217 format.',
            type: 'string',
            default: {
                '@path': '$.properties.currency'
            }
        },
        is_app_incrementality: {
            label: 'App Conversion for Incrementality Study',
            description: 'Set to true if this is an app conversion for an incrementality study.',
            type: 'boolean',
            default: false
        },
        phone_number: {
            label: 'Phone Number',
            description: 'Phone number of the individual who triggered the conversion event, in E.164 standard format, e.g. +14150000000.',
            type: 'string',
            default: {
                '@if': {
                    exists: { '@path': '$.properties.phone' },
                    then: { '@path': '$.properties.phone' },
                    else: { '@path': '$.traits.phone' }
                }
            }
        },
        first_name: {
            label: 'First Name',
            description: 'First name of the individual who triggered the conversion event.',
            type: 'string',
            default: {
                '@if': {
                    exists: { '@path': '$.properties.firstName' },
                    then: { '@path': '$.properties.firstName' },
                    else: { '@path': '$.traits.firstName' }
                }
            }
        },
        last_name: {
            label: 'Last Name',
            description: 'Last name of the individual who triggered the conversion event.',
            type: 'string',
            default: {
                '@if': {
                    exists: { '@path': '$.properties.lastName' },
                    then: { '@path': '$.properties.lastName' },
                    else: { '@path': '$.traits.lastName' }
                }
            }
        },
        street_address: {
            label: 'Street Address',
            description: 'Street address of the individual who triggered the conversion event.',
            type: 'string',
            default: {
                '@if': {
                    exists: { '@path': '$.properties.address.street' },
                    then: { '@path': '$.properties.address.street' },
                    else: { '@path': '$.traits.address.street' }
                }
            }
        },
        city: {
            label: 'City',
            description: 'City of the individual who triggered the conversion event.',
            type: 'string',
            default: {
                '@if': {
                    exists: { '@path': '$.properties.address.city' },
                    then: { '@path': '$.properties.address.city' },
                    else: { '@path': '$.traits.address.city' }
                }
            }
        },
        region: {
            label: 'Region',
            description: 'Region of the individual who triggered the conversion event.',
            type: 'string',
            default: {
                '@if': {
                    exists: { '@path': '$.properties.address.state' },
                    then: { '@path': '$.properties.address.state' },
                    else: { '@path': '$.traits.address.state' }
                }
            }
        },
        post_code: {
            label: 'Postal Code',
            description: 'Postal code of the individual who triggered the conversion event.',
            type: 'string',
            default: {
                '@if': {
                    exists: { '@path': '$.properties.address.postalCode' },
                    then: { '@path': '$.properties.address.postalCode' },
                    else: { '@path': '$.traits.address.postalCode' }
                }
            }
        },
        country: {
            label: 'Country',
            description: 'Country of the individual who triggered the conversion event.',
            type: 'string',
            default: {
                '@if': {
                    exists: { '@path': '$.properties.address.country' },
                    then: { '@path': '$.properties.address.country' },
                    else: { '@path': '$.traits.address.country' }
                }
            }
        }
    },
    perform: async (request, { payload }) => {
        const conversionData = formatter_1.cleanData({
            oid: payload.transaction_id,
            user_agent: payload.user_agent,
            conversion_time: +new Date(payload.conversion_time) * 1000,
            label: payload.conversion_label,
            value: payload.value,
            currency_code: payload.currency_code,
            is_app_incrementality: payload.is_app_incrementality ? 1 : 0
        });
        const address = formatter_1.cleanData({
            hashed_first_name: formatter_1.formatFirstName(payload.first_name),
            hashed_last_name: formatter_1.formatLastName(payload.last_name),
            hashed_street_address: formatter_1.formatStreet(payload.street_address),
            city: formatter_1.formatCity(payload.city),
            region: formatter_1.formatRegion(payload.region),
            postcode: payload.post_code,
            country: payload.country
        });
        if (!payload.email && !Object.keys(address).length) {
            throw new actions_core_1.IntegrationError('Either a valid email address or at least one address property (firstName, lastName, street, city, region, postalCode, or country) is required to send a valid conversion.', 'Missing required fields.', 400);
        }
        const pii_data = formatter_1.cleanData({
            hashed_email: formatter_1.formatEmail(payload.email),
            hashed_phone_number: [formatter_1.formatPhone(payload.phone_number)]
        });
        try {
            return await request('https://www.google.com/ads/event/api/v1', {
                method: 'post',
                json: {
                    pii_data: { ...pii_data, address: [address] },
                    ...conversionData
                }
            });
        }
        catch (err) {
            if (err instanceof actions_core_1.HTTPError) {
                const statusCode = err.response.status;
                if (statusCode === 400) {
                    const data = err.response.data;
                    const invalidOAuth = data.error_statuses.find((es) => es.error_code === 'INVALID_OAUTH_TOKEN');
                    if (invalidOAuth) {
                        throw new actions_core_1.IntegrationError('The OAuth token is missing or invalid.', 'INVALID_OAUTH_TOKEN', 401);
                    }
                }
            }
            throw err;
        }
    }
};
exports.default = action;
//# sourceMappingURL=index.js.map