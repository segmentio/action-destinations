"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cordial_client_1 = __importDefault(require("../cordial-client"));
const user_identifier_1 = require("../user-identifier");
const common_fields_1 = require("../common-fields");
const action = {
    title: 'Remove Contact from List',
    description: 'Remove Contact from Cordial List',
    fields: {
        ...common_fields_1.commonFields,
        groupId: {
            label: 'Group ID',
            description: 'Segment Group ID',
            type: 'string',
            required: true,
            default: {
                '@path': '$.groupId'
            }
        },
        listName: {
            label: 'List Name',
            description: 'Cordial List Name',
            type: 'string',
            default: {
                '@if': {
                    exists: { '@path': '$.traits.name' },
                    then: { '@path': '$.traits.name' },
                    else: { '@path': '$.groupId' }
                }
            }
        }
    },
    perform: async (request, { settings, payload }) => {
        const client = new cordial_client_1.default(settings, request);
        const list = await client.getList(payload.groupId, payload.listName);
        if (!list) {
            return true;
        }
        const userIdentifier = user_identifier_1.getUserIdentifier(payload.identifyByKey, payload.identifyByValue);
        return client.removeContactFromList(userIdentifier, list);
    }
};
exports.default = action;
//# sourceMappingURL=index.js.map