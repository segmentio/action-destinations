"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pipedrive_client_1 = __importDefault(require("../pipedriveApi/pipedrive-client"));
const organizations_1 = require("../pipedriveApi/organizations");
const utils_1 = require("../utils");
const fieldHandler = pipedrive_client_1.default.fieldHandler;
const action = {
    title: 'Create or Update Organization',
    description: "Update an organization in Pipedrive or create it if it doesn't exist yet.",
    defaultSubscription: 'type = "group"',
    fields: {
        match_field: {
            label: 'Match field',
            description: 'If present, used instead of field in settings to find existing organization in Pipedrive.',
            type: 'string',
            required: false,
            dynamic: true
        },
        match_value: {
            label: 'Match value',
            description: 'Value to find existing organization by',
            type: 'string',
            required: true,
            default: {
                '@path': '$.userId'
            }
        },
        name: {
            label: 'Organization Name',
            description: 'Name of the organization',
            type: 'string',
            required: false
        },
        visible_to: {
            label: 'Visible To',
            description: 'Visibility of the Organization. If omitted, visibility will be set to the default visibility setting of this item type for the authorized user.',
            type: 'integer',
            choices: [
                { label: 'Owner & followers (private)', value: 1 },
                { label: 'Entire company (shared)', value: 3 }
            ],
            required: false
        },
        add_time: {
            label: 'Created At',
            description: 'If the organization is created, use this timestamp as the creation timestamp. Format: YYY-MM-DD HH:MM:SS',
            type: 'datetime'
        },
        custom_fields: {
            label: 'Custom fields',
            description: 'New values for custom fields.',
            type: 'object',
            required: false
        }
    },
    dynamicFields: {
        match_field: fieldHandler('organization')
    },
    perform: async (request, { payload, settings }) => {
        const searchField = payload.match_field || settings.personField || 'id';
        const client = new pipedrive_client_1.default(settings, request);
        const organizationId = await client.getId('organization', searchField, payload.match_value);
        const organization = {
            name: payload.name,
            add_time: payload.add_time ? `${payload.add_time}` : undefined,
            visible_to: payload.visible_to
        };
        utils_1.addCustomFieldsFromPayloadToEntity(payload, organization);
        return organizations_1.createOrUpdateOrganizationById(request, settings.domain, organizationId, organization);
    }
};
exports.default = action;
//# sourceMappingURL=index.js.map