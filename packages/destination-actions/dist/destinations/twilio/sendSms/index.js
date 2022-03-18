"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const action = {
    title: 'Send SMS',
    description: 'Sends an SMS message',
    defaultSubscription: 'type = "track"',
    fields: {
        To: {
            label: 'To',
            description: 'The Phone Number to send a SMS to',
            type: 'string',
            required: true
        },
        Body: {
            label: 'Body',
            description: 'The message body',
            type: 'text',
            required: true
        }
    },
    perform: (request, data) => {
        return request(`https://api.twilio.com/2010-04-01/Accounts/${data.settings.accountId}/Messages.json`, {
            method: 'post',
            body: new URLSearchParams({
                From: data.settings.phoneNumber,
                ...data.payload
            })
        });
    }
};
exports.default = action;
//# sourceMappingURL=index.js.map