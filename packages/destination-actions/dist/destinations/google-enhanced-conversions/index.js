"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const postConversion_1 = __importDefault(require("./postConversion"));
const destination = {
    name: 'Google Enhanced Conversions',
    mode: 'cloud',
    authentication: {
        scheme: 'oauth2',
        fields: {
            conversionTrackingId: {
                label: 'Conversion ID',
                description: 'You will find this information in the event snippet for your conversion action, for example `send_to: AW-CONVERSION_ID/AW-CONVERSION_LABEL`. In the sample snippet, AW-CONVERSION_ID stands for the conversion ID unique to your account. Enter the conversion Id, without the AW- prefix.',
                type: 'string',
                required: true
            }
        },
        testAuthentication: async (_request) => {
            return true;
        },
        refreshAccessToken: async (request, { auth }) => {
            const res = await request('https://www.googleapis.com/oauth2/v4/token', {
                method: 'POST',
                body: new URLSearchParams({
                    refresh_token: auth.refreshToken,
                    client_id: auth.clientId,
                    client_secret: auth.clientSecret,
                    grant_type: 'refresh_token'
                })
            });
            return { accessToken: res.data.access_token };
        }
    },
    extendRequest({ settings, auth }) {
        return {
            headers: {
                authorization: `Bearer ${auth?.accessToken}`
            },
            searchParams: {
                conversion_tracking_id: settings.conversionTrackingId
            }
        };
    },
    actions: {
        postConversion: postConversion_1.default
    }
};
exports.default = destination;
//# sourceMappingURL=index.js.map