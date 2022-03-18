"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sendSms_1 = __importDefault(require("./sendSms"));
const destination = {
    name: 'Twilio',
    mode: 'cloud',
    authentication: {
        scheme: 'basic',
        fields: {
            accountId: {
                label: 'Account Id',
                description: 'Your Twilio Account Id',
                type: 'string',
                required: true
            },
            token: {
                label: 'Token',
                description: 'Your Twilio Token.',
                type: 'string',
                required: true
            },
            phoneNumber: {
                label: 'Phone Number',
                description: 'Your Twilio Phone Number with Country Code.',
                type: 'string',
                required: true
            }
        },
        testAuthentication: (request) => {
            return request('https://api.twilio.com/2010-04-01/Accounts');
        }
    },
    extendRequest({ settings }) {
        return {
            username: settings.accountId,
            password: settings.token
        };
    },
    actions: {
        sendSMS: sendSms_1.default
    }
};
exports.default = destination;
//# sourceMappingURL=index.js.map