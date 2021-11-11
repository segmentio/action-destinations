import dayjs from '../../../lib/dayjs'
import { get } from '@segment/actions-core'
import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Create or Update a Deal',
  description: "Update a Deal in Pipedrive or create it if it doesn't exist yet.",
  defaultSubscription: 'type = "track"',
  fields: {
    identifier: {
      label: 'Deal ID',
      description:
        'Identifier used to find existing Deal in Pipedrive. If not provided, will always create a new one.',
      type: 'integer'
    },
    title: {
      label: 'Title',
      description:
        'Deal title  (required for new Leads)',
      type: 'string',
      required: true
    },
    value: {
      label: 'Value',
      description: 'Value of the deal. If omitted, value will be set to 0.',
      type: 'string'
    },
    currency: {
      label: 'Currency',
      description:
        'Currency of the deal. Accepts a 3-character currency code. If omitted, currency will be set to the default currency of the authorized user.',
      type: 'string'
    },
    user_id: {
      label: 'User ID',
      description:
        'The ID of the User which will be the owner of the created Deal. If not provided, the user making the request will be used.',
      type: 'integer'
    },
    person_id: {
      label: 'Person ID',
      description:
        'The ID of the Person this Deal is associated with.',
      type: 'integer'
    },
    org_id: {
      label: 'Organization ID',
      description:
        'The ID of the Organization this Deal is associated with.',
      type: 'integer'
    },
    stage_id: {
      label: 'Stage ID',
      description:
        "The ID of a stage this Deal will be placed in a pipeline (note that you can't supply the ID of the pipeline as this will be assigned automatically based on stage_id). If omitted, the deal will be placed in the first stage of the default pipeline.",
      type: 'string'
    },
    status: {
      label: 'Status',
      description:
        'Deal status - open, won, lost or deleted. If omitted, status will be set to open.',
      type: 'string',
      default: 'open',
    },
    expected_close_date: {
      label: 'Expected Close Date',
      description:
        'The expected close date of the Deal. In ISO 8601 format: YYYY-MM-DD.',
      type: 'string'
    },
    probability: {
      label: 'Success Probability',
      description:
        'Deal success probability percentage. Used/shown only when deal_probability for the pipeline of the deal is enabled.',
      type: 'number'
    },
    lost_reason: {
      label: 'Lost Reason',
      description:
        'Optional message about why the deal was lost (to be used when status=lost)',
      type: 'number'
    },
    visible_to: {
      label: 'Visible To',
      description:
        'Visibility of the deal. If omitted, visibility will be set to the default visibility setting of this item type for the authorized user. 1 -Owner & followers (private), 3	- Entire company (shared)',
      type: 'integer'
    },
    add_time: {
      label: 'Created At',
      description: 'If the deal is created, use this timestamp as the creation timestamp. Format: YYY-MM-DD HH:MM:SS',
      type: 'string'
    }
  },
  perform: async (request, { payload, settings }) => {
    let dealId = null

    if (payload.identifier !== undefined && payload.identifier !== null) {
      const search = await request(`https://${settings.domain}.pipedrive.com/api/v1/deals/${payload.identifier}`)

      dealId = get(search.data, 'data.id')
    }

    const deal = {
      title: payload.title,
      value: payload.value,
      currency: payload.currency,
      user_id: payload.user_id,
      person_id: payload.person_id,
      org_id: payload.org_id,
      stage_id: payload.stage_id,
      status: payload.status,
      expected_close_date: payload.expected_close_date,
      probability: payload.probability,
      lost_reason: payload.lost_reason,
      visible_to: payload.visible_to,
    }

    if (dealId === undefined || dealId === null) {
      return request(`https://${settings.domain}.pipedrive.com/api/v1/deals`, {
        method: 'post',
        json: {
          ...deal,
          add_time: payload.add_time ? dayjs.utc(payload.add_time).format('YYYY-MM-DD HH:MM:SS') : undefined
        }
      })
    }

    return request(`https://${settings.domain}.pipedrive.com/api/v1/deals/${dealId}`, {
      method: 'put',
      json: deal
    })
  }
}

export default action
