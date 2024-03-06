import { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { user_identifiers, event_type, event_action, data, timestamp } from '../fields'
import { hosts } from '../utils'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Custom Event',
  description: 'Send Segment custom track() events to Optimizely Data Platform',
  fields: {
    user_identifiers: user_identifiers,
    event_type: { ...event_type },
    event_action: { ...event_action },
    data: { ...data },
    timestamp: { ...timestamp }
  },
  perform: (request, { payload, settings }) => {
    const host = hosts[settings.region]

    const body = {
      user_identifiers: payload.user_identifiers,
      action: payload.event_action,
      type: payload.event_type ?? 'custom',
      timestamp: payload.timestamp,
      data: payload.data
    }

    return request(`${host}/custom_event`, {
      method: 'post',
      json: body
    })
  }
}

export default action
