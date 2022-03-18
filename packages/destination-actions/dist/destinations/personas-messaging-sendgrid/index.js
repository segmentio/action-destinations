"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sendEmail_1 = __importDefault(require("./sendEmail"));
const destination = {
    name: 'Actions Personas Messaging Sendgrid',
    mode: 'cloud',
    description: 'This is a personas specific action to send an email',
    authentication: {
        scheme: 'custom',
        fields: {
            unlayerApiKey: {
                label: 'Unlayer API Key',
                type: 'password',
                description: 'The API key for your Unlayer account'
            },
            sendGridApiKey: {
                label: 'API Key',
                type: 'password',
                description: 'The Api Key for your sendGrid account',
                required: true
            },
            profileApiEnvironment: {
                label: 'Profile API Environment',
                description: 'Profile API Environment',
                type: 'string',
                required: true
            },
            profileApiAccessToken: {
                label: 'Profile API Access Token',
                description: 'Profile API Access Token',
                type: 'password',
                required: true
            },
            spaceId: {
                label: 'Space ID',
                description: 'Space ID',
                type: 'string',
                required: true
            },
            sourceId: {
                label: 'Source ID',
                description: 'Source ID',
                type: 'string',
                required: true
            }
        },
        testAuthentication: (request) => {
            return request('https://api.sendgrid.com/v3/mail_settings');
        }
    },
    actions: {
        sendEmail: sendEmail_1.default
    }
};
exports.default = destination;
//# sourceMappingURL=index.js.map