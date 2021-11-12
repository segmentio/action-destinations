import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import { createNote, Note } from '../pipedriveApi/notes';
import PipedriveClient from '../pipedriveApi/pipedrive-client';
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Create or Update a Note',
  description: "Update a Note in Pipedrive or create it if it doesn't exist yet.",
  defaultSubscription: 'type = "track"',
  fields: {
    person_match_field: {
      label: 'Person match field',
      description: 'If present, used instead of field in settings to find existing person in Pipedrive.',
      type: 'string',
      required: false,
      dynamic: true,
      default: {
        '@literal': 'id'
      },

    },
    person_match_value: {
      label: 'Person match value',
      description: 'Value to find existing person by',
      type: 'string',
      required: true,
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
      default: {
        '@literal': 'id'
      },

    },
    organization_match_value: {
      label: 'Organization match value',
      description: 'Value to find existing organization by',
      type: 'string',
      required: true,
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
      default: {
        '@literal': 'id'
      },

    },
    deal_match_value: {
      label: 'Deal match value',
      description: 'Value to find existing deal by',
      type: 'string',
      required: true,
      default: {
        '@path': '$.userId'
      }
    },

    content: {
      label: 'Note Content',
      description: 'Content of the note in HTML format. Subject to sanitization on the back-end.',
      type: 'string',
      required: true,
    },

  },

  dynamicFields: {
    person_match_field: async (request, { settings }) => {
      const client = new PipedriveClient(settings, request);
      return client.getFields('person');
    },
    organization_match_field: async (request, { settings }) => {
      const client = new PipedriveClient(settings, request);
      return client.getFields('organization');
    },
    deal_match_field: async (request, { settings }) => {
      const client = new PipedriveClient(settings, request);
      return client.getFields('deal');
    },
  },

  perform: async (request, { payload, settings }) => {

    const client = new PipedriveClient(settings, request);

    const personSearchField = payload.person_match_field || settings.personField || 'id';
    const personId = await client.getId("person", personSearchField, payload.person_match_value);

    const organizationSearchField = payload.organization_match_field || settings.organizationField || 'id';
    const organizationId = await client.getId("organization", organizationSearchField, payload.organization_match_value);

    const dealSearchField = payload.deal_match_field || settings.dealField || 'id';
    const dealId = await client.getId("deal", dealSearchField, payload.deal_match_value);

    const note: Note = {
      content: payload.content,
      person_id: personId || undefined,
      org_id: organizationId || undefined,
      deal_id: dealId || undefined,
    }

    return createNote(request, settings.domain, note);
  }

}

export default action
