"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const createUpdateOrganization_1 = __importDefault(require("./createUpdateOrganization"));
const createUpdatePerson_1 = __importDefault(require("./createUpdatePerson"));
const createUpdateActivity_1 = __importDefault(require("./createUpdateActivity"));
const createUpdateDeal_1 = __importDefault(require("./createUpdateDeal"));
const createUpdateLead_1 = __importDefault(require("./createUpdateLead"));
const createUpdateNote_1 = __importDefault(require("./createUpdateNote"));
const destination = {
    name: 'Actions Pipedrive',
    mode: 'cloud',
    authentication: {
        scheme: 'custom',
        fields: {
            domain: {
                label: 'Domain',
                description: 'Pipedrive domain. This is found in Pipedrive in Settings > Company settings > Company domain.',
                type: 'string',
                required: true
            },
            apiToken: {
                label: 'API Token',
                description: 'Pipedrive API token. This is found in Pipedrive in Settings > Personal preferences > API > Your personal API token.',
                type: 'string',
                required: true
            },
            personField: {
                label: 'External ID field for a Person in Pipedrive',
                description: 'This is a key by which a Person in Pipedrive will be searched. It can be either Person id or has of a custom field containing external id. Default value is `person_id`.',
                type: 'string',
                default: 'id',
                required: false
            },
            organizationField: {
                label: 'External ID field for an Organization in Pipedrive',
                description: 'This is a key by which an Organization in Pipedrive will be searched. It can be either Organization id or has of a custom field containing external id. Default value is `org_id`.',
                type: 'string',
                default: 'id',
                required: false
            },
            dealField: {
                label: 'External ID field for a Deal in Pipedrive',
                description: 'This is a key by which a Deal in Pipedrive will be searched. It can be either Deal id or has of a custom field containing external id. Default value is `deal_id`.',
                type: 'string',
                default: 'id',
                required: false
            }
        },
        testAuthentication: (request, { settings }) => {
            return request(`https://${settings.domain}.pipedrive.com/api/v1/users/me`);
        }
    },
    extendRequest({ settings }) {
        return {
            searchParams: {
                api_token: settings.apiToken
            }
        };
    },
    actions: {
        createUpdateOrganization: createUpdateOrganization_1.default,
        createUpdatePerson: createUpdatePerson_1.default,
        createUpdateActivity: createUpdateActivity_1.default,
        createUpdateDeal: createUpdateDeal_1.default,
        createUpdateLead: createUpdateLead_1.default,
        createUpdateNote: createUpdateNote_1.default
    }
};
exports.default = destination;
//# sourceMappingURL=index.js.map