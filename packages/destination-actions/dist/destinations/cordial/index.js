"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const createContactactivity_1 = __importDefault(require("./createContactactivity"));
const upsertContact_1 = __importDefault(require("./upsertContact"));
const addContactToList_1 = __importDefault(require("./addContactToList"));
const removeContactFromList_1 = __importDefault(require("./removeContactFromList"));
const destination = {
    name: 'Cordial (Actions)',
    description: 'Sync Segment Users, Groups and Events to Cordial',
    slug: 'actions-cordial',
    mode: 'cloud',
    authentication: {
        scheme: 'basic',
        fields: {
            apiKey: {
                label: 'API Key',
                description: 'Your Cordial API Key',
                type: 'string',
                required: true
            },
            endpoint: {
                label: 'Endpoint',
                description: "Cordial API endpoint. Leave default, unless you've been provided with another one. [See more details](https://support.cordial.com/hc/en-us/sections/200553578-REST-API-Introduction-and-Overview)",
                type: 'string',
                required: true,
                format: 'uri',
                choices: [
                    { label: 'US-EAST	(https://api.cordial.io)', value: 'https://api.cordial.io' },
                    { label: 'US-WEST	(https://api.usw2.cordial.io)', value: 'https://api.usw2.cordial.io' },
                    { label: 'Staging	(https://api.stg.cordialdev.com)', value: 'https://api.stg.cordialdev.com' }
                ],
                default: 'https://api.cordial.io'
            }
        },
        testAuthentication: (request, { settings }) => {
            return request(settings.endpoint + '/v2/health');
        }
    },
    extendRequest({ settings }) {
        return { username: settings.apiKey };
    },
    actions: {
        createContactactivity: createContactactivity_1.default,
        upsertContact: upsertContact_1.default,
        addContactToList: addContactToList_1.default,
        removeContactFromList: removeContactFromList_1.default
    }
};
exports.default = destination;
//# sourceMappingURL=index.js.map