import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import PipedriveClient from '../pipedriveApi/pipedrive-client'
import { createUpdateLead, Lead, LeadValue } from '../pipedriveApi/leads'
import { IntegrationError } from '@segment/actions-core'

const fieldHandler = PipedriveClient.fieldHandler

const action: ActionDefinition<Settings, Payload> = {
  title: 'Create or update Lead',
  description: "Update a Lead in Pipedrive or create it if it doesn't exist yet.",
  defaultSubscription: 'type = "identify"',
  fields: {
    lead_id: {
      label: 'Lead ID',
      description: 'ID of Lead in Pipedrive to Update. If left empty, a new one will be created',
      type: 'string',
      required: false,
      default: {
        '@if': {
          exists: { '@path': '$.traits.lead_id' },
          then: { '@path': '$.traits.lead_id' },
          else: { '@path': '$.properties.lead_id' }
        }
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
      description: 'Value to find existing person by. Required unless organization_match_value present',
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
      description: 'Value to find existing organization by. Required unless person_match_value present',
      type: 'string',
      required: false,
      default: {
        '@path': '$.context.groupId'
      }
    },
    title: {
      label: 'Title',
      description: 'The name of the Lead',
      type: 'string',
      required: true,
      default: {
        '@if': {
          exists: { '@path': '$.traits.title' },
          then: { '@path': '$.traits.title' },
          else: { '@path': '$.properties.title' }
        }
      }
    },
    amount: {
      label: 'Amount',
      description: 'Potential value of the lead',
      type: 'number',
      required: false,
      default: {
        '@if': {
          exists: { '@path': '$.traits.amount' },
          then: { '@path': '$.traits.amount' },
          else: { '@path': '$.properties.amount' }
        }
      }
    },
    currency: {
      label: 'Currency',
      description: 'Three-letter code of the currency, e.g. USD',
      type: 'string',
      required: false,
      default: {
        '@if': {
          exists: { '@path': '$.traits.currency' },
          then: { '@path': '$.traits.currency' },
          else: { '@path': '$.properties.currency' }
        }
      }
    },
    expected_close_date: {
      label: 'Expected Close Date',
      description:
        'The date of when the Deal which will be created from the Lead is expected to be closed. In ISO 8601 format: YYYY-MM-DD.',
      type: 'string',
      required: false,
      default: {
        '@if': {
          exists: { '@path': '$.traits.expected_close_date' },
          then: { '@path': '$.traits.expected_close_date' },
          else: { '@path': '$.properties.expected_close_date' }
        }
      }
    },
    visible_to: {
      label: 'Visible To',
      description:
        'Visibility of the Lead. If omitted, visibility will be set to the default visibility setting of this item type for the authorized user.',
      type: 'integer',
      choices: [
        { label: 'Owner & followers (private)', value: 1 },
        { label: 'Entire company (shared)', value: 3 }
      ],
      required: false
    },
    add_time: {
      label: 'Created At',
      description: 'If the lead is created, use this timestamp as the creation timestamp. Format: YYY-MM-DD HH:MM:SS',
      type: 'datetime',
      required: false
    }
  },

  dynamicFields: {
    person_match_field: fieldHandler('person'),
    organization_match_field: fieldHandler('organization')
  },

  perform: async (request, { payload, settings }) => {
    const client = new PipedriveClient(settings, request)

    const personSearchField = payload.person_match_field || settings.personField || 'id'
    const organizationSearchField = payload.organization_match_field || settings.organizationField || 'id'
    const [personId, organizationId] = await Promise.all([
      client.getId('person', personSearchField, payload.person_match_value),
      client.getId('organization', organizationSearchField, payload.organization_match_value)
    ])

    const leadValue: LeadValue = {
      amount: payload.amount,
      currency: payload.currency
    }

    const lead: Lead = {
      id: payload.lead_id,
      title: payload.title,
      expected_close_date: payload.expected_close_date,
      visible_to: payload.visible_to,
      person_id: personId || undefined,
      organization_id: organizationId || undefined,
      value: payload.amount && payload.currency ? leadValue : undefined,
      add_time: payload.add_time ? `${payload.add_time}` : undefined
    }

    if (!lead.id && !lead.person_id && !lead.organization_id) {
      throw new IntegrationError(
        'No related organization or person, unable to create lead!',
        'INVALID_REQUEST_DATA',
        400
      )
    }

    return createUpdateLead(client, lead)
  }
}

export default action
