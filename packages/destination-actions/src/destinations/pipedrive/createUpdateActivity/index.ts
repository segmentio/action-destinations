import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

import { get } from '@segment/actions-core'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Create or Update an Activity',
  description: "Update an Activity in Pipedrive or create it if it doesn't exist yet.",
  defaultSubscription: 'type = "track"',
  fields: {
    identifier: {
      label: 'Activity ID',
      description:
        'Identifier used to find existing activity in Pipedrive. If not provided, will always create a new one.',
      type: 'integer'
    },
    type: {
      label: 'Type',
      description:
        'Type of the Activity. This is in correlation with the key_string parameter of ActivityTypes. When value for type is not set, it will be given a default value `Call`',
      type: 'string'
    },
    subject: {
      label: 'Activity Subject',
      description: 'Subject of the Activity. When value for subject is not set, it will be given a default value `Call`.',
      type: 'string'
    },
    note: {
      label: 'Note',
      description:
        'Note of the Activity (HTML format)',
      type: 'string'
    },
    deal_id: {
      label: 'Deal ID',
      description:
        'The ID of the Deal this Activity is associated with.',
      type: 'integer'
    },
    person_id: {
      label: 'Person ID',
      description:
        'The ID of the Person this Activity is associated with.',
      type: 'integer'
    },
    org_id: {
      label: 'Organization ID',
      description:
        'The ID of the Organization this Activity is associated with.',
      type: 'integer'
    },
    due_date: {
      label: 'Due Date',
      description:
        'Due date of the Activity. Format: YYYY-MM-DD',
      type: 'string'
    },
    due_time: {
      label: 'Due Time',
      description:
        'Due time of the Activity in UTC. Format: HH:MM',
      type: 'string'
    },
    done: {
      label: 'Done',
      description:
        'Whether the Activity is done or not. 0 = Not done, 1 = Done',
      type: 'integer'
    },
  },
  perform: async (request, { payload, settings }) => {
    let activityId = null

    if (payload.identifier !== undefined && payload.identifier !== null) {
      const search = await request(`https://${settings.domain}.pipedrive.com/api/v1/activities/${payload.identifier}`)

      activityId = get(search.data, 'data.id')
    }

    const activity = {
      subject: payload.subject,
      note: payload.note,
      type: payload.type,
      deal_id: payload.deal_id,
      person_id: payload.person_id,
      org_id: payload.org_id,
      due_date: payload.due_date,
      due_time: payload.due_time,
      done: payload.done,
    }

    if (activityId === undefined || activityId === null) {
      return request(`https://${settings.domain}.pipedrive.com/api/v1/activities`, {
        method: 'post',
        json: activity
      })
    }

    return request(`https://${settings.domain}.pipedrive.com/api/v1/activities/${activityId}`, {
      method: 'put',
      json: activity
    })
  }
}

export default action
