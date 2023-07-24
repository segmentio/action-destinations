import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { name, region, pii_type, email, enable_batching, event_name, batch_size } from '../properties'
import { processPayload } from '../functions'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Sync Audience to CRM Data Segment',
  description: 'Drop users into the given CRM Data Segment',
  defaultSubscription: 'event = "Audience Entered"',
  fields: {
    name: { ...name },
    region: { ...region },
    pii_type: { ...pii_type },
    email: { ...email },
    enable_batching: { ...enable_batching },
    event_name: { ...event_name },
    batch_size: { ...batch_size }
  },
  perform: async (request, { settings, payload }) => {
    return processPayload(request, settings, [payload])
  },
  performBatch: async (request, { settings, payload }) => {
    return processPayload(request, settings, payload)
  }
}

export default action
