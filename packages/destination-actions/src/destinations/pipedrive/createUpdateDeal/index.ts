import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import PipedriveClient from '../pipedriveApi/pipedrive-client'
import { createUpdateDeal, Deal } from '../pipedriveApi/deals'
import { IntegrationError } from '@segment/actions-core'
import { addCustomFieldsFromPayloadToEntity } from '../utils'

const fieldHandler = PipedriveClient.fieldHandler

const action: ActionDefinition<Settings, Payload> = {
  title: 'Create or update a Deal',
  description: "Update a Deal in Pipedrive or create it if it doesn't exist yet.",
  defaultSubscription: 'type = "track" and event = "Deal Upserted"',
  fields: {
    deal_match_field: {
      label: 'Deal match field',
      description: 'If present, used instead of field in settings to find existing deal in Pipedrive.',
      type: 'string',
      required: false,
      dynamic: true
    },
    deal_match_value: {
      label: 'Deal match value',
      description: 'Value to find existing deal by',
      type: 'string',
      required: false,
      default: {
        '@path': '$.properties.deal_id'
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
      description: 'Deal title  (required for new Leads)',
      type: 'string',
      required: true,
      default: {
        '@path': '$.properties.title'
      }
    },
    value: {
      label: 'Value',
      description: 'Value of the deal. If omitted, value will be set to 0.',
      type: 'string',
      required: false,
      default: {
        '@path': '$.properties.value'
      }
    },
    currency: {
      label: 'Currency',
      description:
        'Currency of the deal. Accepts a 3-character currency code. If omitted, currency will be set to the default currency of the authorized user.',
      type: 'string',
      required: false,
      default: {
        '@path': '$.properties.currency'
      }
    },
    stage_id: {
      label: 'Stage ID',
      description:
        "The ID of a stage this Deal will be placed in a pipeline (note that you can't supply the ID of the pipeline as this will be assigned automatically based on stage_id). If omitted, the deal will be placed in the first stage of the default pipeline.",
      type: 'number',
      required: false,
      default: {
        '@path': '$.properties.stage_id'
      }
    },
    status: {
      label: 'Status',
      description: 'Deal status - open, won, lost or deleted. If omitted, status will be set to open.',
      type: 'string',
      choices: [
        { label: 'Open', value: 'open' },
        { label: 'Won', value: 'won' },
        { label: 'Lost', value: 'lost' },
        { label: 'Deleted', value: 'deleted' }
      ],
      required: false
    },
    expected_close_date: {
      label: 'Expected Close Date',
      description: 'The expected close date of the Deal. In ISO 8601 format: YYYY-MM-DD.',
      type: 'string',
      required: false,
      default: {
        '@path': '$.properties.expected_close_date'
      }
    },
    probability: {
      label: 'Success Probability',
      description:
        'Deal success probability percentage. Used/shown only when deal_probability for the pipeline of the deal is enabled.',
      type: 'number',
      required: false,
      default: {
        '@path': '$.properties.success_probability'
      }
    },
    lost_reason: {
      label: 'Lost Reason',
      description: 'Optional message about why the deal was lost (to be used when status=lost)',
      type: 'string',
      required: false,
      default: {
        '@path': '$.properties.lost_reason'
      }
    },
    visible_to: {
      label: 'Visible To',
      description:
        'Visibility of the deal. If omitted, visibility will be set to the default visibility setting of this item type for the authorized user. 1 -Owner & followers (private), 3	- Entire company (shared)',
      type: 'integer',
      choices: [
        { label: 'Owner & followers (private)', value: 1 },
        { label: 'Entire company (shared)', value: 3 }
      ],
      required: false
    },
    add_time: {
      label: 'Created At',
      description: 'If the deal is created, use this timestamp as the creation timestamp. Format: YYY-MM-DD HH:MM:SS',
      type: 'datetime',
      required: false
    },

    custom_fields: {
      label: 'Custom fields',
      description: 'New values for custom fields.',
      type: 'object',
      required: false
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

    const deal: Deal = {
      id: dealId || undefined,
      title: payload.title,
      value: payload.value,
      currency: payload.currency,
      stage_id: payload.stage_id,
      status: payload.status,
      expected_close_date: payload.expected_close_date,
      probability: payload.probability,
      lost_reason: payload.lost_reason,
      visible_to: payload.visible_to,
      add_time: payload.add_time ? `${payload.add_time}` : undefined,
      person_id: personId || undefined,
      org_id: organizationId || undefined
    }

    if (!deal.id && !deal.person_id && !deal.org_id) {
      throw new IntegrationError(
        'No related organization or person, unable to create deal!',
        'INVALID_REQUEST_DATA',
        400
      )
    }
    if (!deal.id)
      if (payload.deal_match_field && payload.deal_match_value)
        // if there's no deal.id then we're doing a create operation, so we should include the deal_match field info so it's recorded on the new entity
        Object.assign(deal, { [payload.deal_match_field]: payload.deal_match_value })

    addCustomFieldsFromPayloadToEntity(payload, deal)

    return createUpdateDeal(client, deal)
  }
}

export default action
