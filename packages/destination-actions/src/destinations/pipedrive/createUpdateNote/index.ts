import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import { createNote, Note } from '../pipedriveApi/notes'
import PipedriveClient from '../pipedriveApi/pipedrive-client'
import type { Payload } from './generated-types'
import { IntegrationError } from '@segment/actions-core'

const fieldHandler = PipedriveClient.fieldHandler

const action: ActionDefinition<Settings, Payload> = {
  title: 'Create or update a Note',
  description: "Update a Note in Pipedrive or create it if it doesn't exist yet.",
  defaultSubscription: 'type = "track" and event = "Note Upserted"',
  fields: {
    note_id: {
      label: 'Note ID',
      description: 'ID of Note in Pipedrive to Update. If left empty, a new one will be created',
      type: 'integer',
      required: false,
      default: {
        '@path': '$.properties.note_id'
      }
    },
    lead_id: {
      label: 'Lead ID',
      description: 'ID of Lead in Pipedrive to link to. One of Lead, Person, Organization or Deal must be linked!',
      type: 'string',
      required: false,
      default: {
        '@path': '$.properties.lead_id'
      }
    },
    person_match_field: {
      label: 'Person match field',
      description: 'If present, used instead of field in settings to find existing person in Pipedrive.',
      type: 'string',
      required: false,
      dynamic: true
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
      dynamic: true
    },
    organization_match_value: {
      label: 'Organization match value',
      description: 'Value to find existing organization by. One of Lead, Person, Organization or Deal must be linked!',
      type: 'string',
      required: false,
      default: {
        '@path': '$.context.groupId'
      }
    },
    deal_match_field: {
      label: 'Deal match field',
      description: 'If present, used instead of field in settings to find existing deal in Pipedrive.',
      type: 'string',
      required: false,
      dynamic: true
    },
    deal_match_value: {
      label: 'Deal match value',
      description: 'Value to find existing deal by. One of Lead, Person, Organization or Deal must be linked!',
      type: 'string',
      required: false,
      default: {
        '@path': '$.properties.deal_id'
      }
    },
    content: {
      label: 'Note Content',
      description: 'Content of the note in text or HTML format. Subject to sanitization on the back-end.',
      type: 'string',
      required: true,
      default: {
        '@path': '$.properties.content'
      }
    }
  },

  dynamicFields: {
    person_match_field: fieldHandler('person'),
    organization_match_field: fieldHandler('organization'),
    deal_match_field: fieldHandler('deal')
  },

  perform: async (request, { payload, settings }) => {
    const client = new PipedriveClient(settings, request)

    const personSearchField = payload.person_match_field || settings.personField || 'id'
    const organizationSearchField = payload.organization_match_field || settings.organizationField || 'id'
    const dealSearchField = payload.deal_match_field || settings.dealField || 'id'

    const [personId, organizationId, dealId] = await Promise.all([
      client.getId('person', personSearchField, payload.person_match_value),
      client.getId('organization', organizationSearchField, payload.organization_match_value),
      client.getId('deal', dealSearchField, payload.deal_match_value)
    ])

    const note: Note = {
      id: payload.note_id,
      content: payload.content,
      lead_id: payload.lead_id,
      person_id: personId || undefined,
      org_id: organizationId || undefined,
      deal_id: dealId || undefined
    }

    if ([note.id, note.lead_id, note.person_id, note.org_id, note.deal_id].every((v) => v === undefined)) {
      throw new IntegrationError(
        'No related organization or person, unable to create/update note!',
        'INVALID_REQUEST_DATA',
        400
      )
    }

    return createNote(client, note)
  }
}

export default action
