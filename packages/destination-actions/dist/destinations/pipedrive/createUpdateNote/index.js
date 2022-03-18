"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const notes_1 = require("../pipedriveApi/notes");
const pipedrive_client_1 = __importDefault(require("../pipedriveApi/pipedrive-client"));
const actions_core_1 = require("@segment/actions-core");
const fieldHandler = pipedrive_client_1.default.fieldHandler;
const action = {
    title: 'Create or Update a Note',
    description: "Update a Note in Pipedrive or create it if it doesn't exist yet.",
    defaultSubscription: 'type = "track"',
    fields: {
        note_id: {
            label: 'Note ID',
            description: 'ID of Note in Pipedrive to Update. If left empty, a new one will be created',
            type: 'integer',
            required: false
        },
        lead_id: {
            label: 'Lead ID',
            description: 'ID of Lead in Pipedrive to link to.  One of Lead, Person, Organization or Deal must be linked!',
            type: 'integer',
            required: false
        },
        person_match_field: {
            label: 'Person match field',
            description: 'If present, used instead of field in settings to find existing person in Pipedrive.',
            type: 'string',
            required: false,
            dynamic: true,
        },
        person_match_value: {
            label: 'Person match value',
            description: 'Value to find existing person by. One of Lead, Person, Organization or Deal must be linked!',
            type: 'string',
            required: false,
            default: {
                '@path': '$.userId'
            }
        },
        organization_match_field: {
            label: 'Organization match field',
            description: 'If present, used instead of field in settings to find existing organization in Pipedrive.',
            type: 'string',
            required: false,
            dynamic: true,
        },
        organization_match_value: {
            label: 'Organization match value',
            description: 'Value to find existing organization by. One of Lead, Person, Organization or Deal must be linked!',
            type: 'string',
            required: false,
            default: {
                '@path': '$.userId'
            }
        },
        deal_match_field: {
            label: 'Deal match field',
            description: 'If present, used instead of field in settings to find existing deal in Pipedrive.',
            type: 'string',
            required: false,
            dynamic: true,
        },
        deal_match_value: {
            label: 'Deal match value',
            description: 'Value to find existing deal by. One of Lead, Person, Organization or Deal must be linked!',
            type: 'string',
            required: false,
            default: {
                '@path': '$.userId'
            }
        },
        content: {
            label: 'Note Content',
            description: 'Content of the note in HTML format. Subject to sanitization on the back-end.',
            type: 'string',
            required: true
        }
    },
    dynamicFields: {
        person_match_field: fieldHandler('person'),
        organization_match_field: fieldHandler('organization'),
        deal_match_field: fieldHandler('deal')
    },
    perform: async (request, { payload, settings }) => {
        const client = new pipedrive_client_1.default(settings, request);
        const personSearchField = payload.person_match_field || settings.personField || 'id';
        const organizationSearchField = payload.organization_match_field || settings.organizationField || 'id';
        const dealSearchField = payload.deal_match_field || settings.dealField || 'id';
        const [personId, organizationId, dealId] = await Promise.all([
            client.getId('person', personSearchField, payload.person_match_value),
            client.getId('organization', organizationSearchField, payload.organization_match_value),
            client.getId('deal', dealSearchField, payload.deal_match_value)
        ]);
        const note = {
            id: payload.note_id,
            content: payload.content,
            lead_id: payload.lead_id,
            person_id: personId || undefined,
            org_id: organizationId || undefined,
            deal_id: dealId || undefined
        };
        if ([note.id, note.lead_id, note.person_id, note.org_id, note.deal_id].every((v) => v === undefined)) {
            throw new actions_core_1.IntegrationError('No related organization or person, unable to create/update note!', 'INVALID_REQUEST_DATA', 400);
        }
        return notes_1.createNote(client, note);
    }
};
exports.default = action;
//# sourceMappingURL=index.js.map