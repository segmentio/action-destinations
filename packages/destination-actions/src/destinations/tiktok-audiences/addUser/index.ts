import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { processPayload } from '../functions'
import {
  custom_audience_name,
  id_type,
  email,
  google_advertising_id,
  event_name,
  enable_batching,
  personas_audience_key
} from '../properties'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Add Users',
  description: 'Add contacts from an Engage Audience to a TikTok Audience Segment.',
  defaultSubscription: 'event = "Audience Entered"',
  fields: {
    custom_audience_name: { ...custom_audience_name },
    id_type: { ...id_type },
    email: { ...email },
    google_advertising_id: { ...google_advertising_id },
    event_name: { ...event_name },
    enable_batching: { ...enable_batching },
    personas_audience_key: { ...personas_audience_key }
  },
  perform: async (request, { settings, payload }) => {
    return processPayload(request, settings, [payload], 'add')
  },
  performBatch: async (request, { settings, payload }) => {
    return processPayload(request, settings, payload, 'add')
  }
}

export default action
