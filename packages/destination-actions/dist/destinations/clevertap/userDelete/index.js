"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const action = {
    title: 'User Delete',
    description: 'The User Delete Action enables you to remove user profiles in CleverTap.',
    fields: {
        identity: {
            label: 'Identity',
            type: 'string',
            description: 'Identity',
            default: { '@path': '$.userId' },
            required: true
        },
    },
    perform: (request, { settings, payload }) => {
        const event = {
            identity: payload.identity,
        };
        return request(`${settings.clevertapEndpoint}/1/delete/profiles.json`, {
            method: 'post',
            json: event,
            headers: {
                "X-CleverTap-Account-Id": `${settings.clevertapAccountId}`,
                "X-CleverTap-Passcode": `${settings.clevertapPasscode}`
            }
        });
    }
};
exports.default = action;
//# sourceMappingURL=index.js.map