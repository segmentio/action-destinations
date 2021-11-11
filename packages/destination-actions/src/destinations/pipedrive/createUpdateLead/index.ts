import { get } from '@segment/actions-core'
import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Create or Update a Lead',
  description: "Update a Lead in Pipedrive or create it if it doesn't exist yet.",
  defaultSubscription: 'type = "identify"',
  fields: {
    identifier: {
      label: 'Lead ID',
      description:
        'Identifier used to find existing Lead in Pipedrive. If not provided, will always create a new one.',
      type: 'string'
    },
    title: {
      label: 'Title',
      description:
        'The name of the Lead (required for new Leads)',
      type: 'string'
    },
    value: {
      label: 'Value',
      description: 'Value of the Lead. If omitted, value will be set to 0.',
      type: 'string',
      default: '***',
    },
    currency: {
      label: 'Currency',
      description:
        'Currency of the Lead. Accepts a 3-character currency code. If omitted, currency will be set to the default currency of the authorized user.',
      type: 'string'
    },
    label_ids: {
      label: 'Label IDs',
      description:
        'Array of the IDs of the Lead Labels which will be associated with the Lead',
      type: 'object'
    },
    owner_id: {
      label: 'Owner User ID',
      description:
        'The ID of the User which will be the owner of the created Lead. If not provided, the user making the request will be used.',
      type: 'integer'
    },
    person_id: {
      label: 'Person ID',
      description:
        'The ID of the Person this Lead is associated with.',
      type: 'integer'
    },
    org_id: {
      label: 'Organization ID',
      description:
        'The ID of the Organization this Lead is associated with.',
      type: 'integer'
    },
    expected_close_date: {
      label: 'Expected Close Date',
      description:
        'The expected close date of the Deal. In ISO 8601 format: YYYY-MM-DD.',
      type: 'string'
    },
    visible_to: {
      label: 'Visible To',
      description:
        'Visibility of the deal. If omitted, visibility will be set to the default visibility setting of this item type for the authorized user. 1 -Owner & followers (private), 3	- Entire company (shared)',
      type: 'integer'
    },
    was_seen: {
      label: 'Was Seen',
      description:
        'A flag indicating whether the Lead was seen by someone in the Pipedrive UI',
      type: 'boolean'
    },
  },
  perform: async (request, { payload, settings }) => {
    let leadId = null

    if (payload.identifier !== undefined && payload.identifier !== null) {
      const search = await request(`https://${settings.domain}.pipedrive.com/api/v1/leads/${payload.identifier}`)

      leadId = get(search.data, 'data.id')
    }

    const valueAvailable = (
      payload.value !== undefined
      && payload.value !== null
      && payload.currency !== undefined
      && payload.currency !== null
    ) 

    const lead = {
      title: payload.title,
      value: valueAvailable ? { amount: payload.value, currency: payload.currency } : undefined,
      label_ids: payload.label_ids,
      owner_id: payload.owner_id,
      person_id: payload.person_id,
      org_id: payload.org_id,
      expected_close_date: payload.expected_close_date,
      visible_to: payload.visible_to,
      was_seen: payload.was_seen,
    }

    if (leadId === undefined || leadId === null) {
      return request(`https://${settings.domain}.pipedrive.com/api/v1/leads`, {
        method: 'post',
        json: lead
      })
    }

    return request(`https://${settings.domain}.pipedrive.com/api/v1/leads/${leadId}`, {
      method: 'patch',
      json: lead
    })
  }
}

export default action
