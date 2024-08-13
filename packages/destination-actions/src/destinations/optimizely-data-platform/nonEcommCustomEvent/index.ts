import { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { user_identifiers, event_type, event_action, data, timestamp, enable_batching, batch_size } from '../fields'
import { hosts } from '../utils'
import { RequestClient } from '@segment/actions-core'

const sendRequest = async (request: RequestClient, payloads: Payload[], settings: Settings) => {
  const host = hosts[settings.region]

  const requestBody = payloads.map((payload) => {
    return {
      user_identifiers: payload.user_identifiers,
      action: payload.event_action,
      type: payload.event_type ?? 'custom',
      timestamp: payload.timestamp,
      data: payload.data
    }
  })

  return request(`${host}/batch_custom_event`, {
    method: 'post',
    json: requestBody
  })
}

const action: ActionDefinition<Settings, Payload> = {
  title: 'Custom Event',
  description: 'Send Segment custom track() events to Optimizely Data Platform',
  fields: {
    user_identifiers,
    event_type,
    event_action,
    data,
    timestamp,
    enable_batching,
    batch_size
  },
  perform: (request, { payload, settings }) => {
    return sendRequest(request, [payload], settings)
  },
  performBatch: (request, { payload, settings }) => {
    return sendRequest(request, payload, settings)
  }
}

export default action
