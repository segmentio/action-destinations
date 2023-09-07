import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { external_id, pii_type, email, enable_batching, event_name, batch_size, merge_mode } from '../properties'
import { processPayload } from '../functions'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Sync Audience to CRM Data Segment',
  description: 'Drop users into the given CRM Data Segment',
  defaultSubscription: 'event = "Audience Entered"',
  fields: {
    external_id: { ...external_id },
    pii_type: { ...pii_type },
    email: { ...email },
    merge_mode: { ...merge_mode },
    enable_batching: { ...enable_batching },
    event_name: { ...event_name },
    batch_size: { ...batch_size }
  },
  perform: async (request, { settings, payload, features }) => {
    return processPayload({
      request,
      settings,
      payloads: [payload],
      features
    })
  },
  performBatch: async (request, { settings, payload, features }) => {
    return processPayload({
      request,
      settings,
      payloads: payload,
      features
    })
  }
}

export default action
