import type { ActionDefinition } from '@segment/actions-core'
import type { Settings, AudienceSettings } from '../generated-types'
import type { Payload } from './generated-types'
import { processPayload } from '../functions'
import {
  email,
  send_email,
  send_advertising_id,
  advertising_id,
  event_name,
  enable_batching,
  external_audience_id
} from '../properties'
import { IntegrationError } from '@segment/actions-core'

const action: ActionDefinition<Settings, Payload, AudienceSettings> = {
  title: 'Remove from Audience',
  description: 'Remove contacts from an Engage Audience to a TikTok Audience Segment.',
  defaultSubscription: 'event = "Audience Exited"',
  fields: {
    email: { ...email },
    advertising_id: { ...advertising_id },
    send_email: { ...send_email },
    send_advertising_id: { ...send_advertising_id },
    event_name: { ...event_name },
    enable_batching: { ...enable_batching },
    external_audience_id: { ...external_audience_id }
  },
  perform: async (request, { audienceSettings, payload, statsContext }) => {
    const statsClient = statsContext?.statsClient
    const statsTag = statsContext?.tags

    if (!audienceSettings) {
      throw new IntegrationError('Bad Request: no audienceSettings found.', 'INVALID_REQUEST_DATA', 400)
    }

    statsClient?.incr('removeFromAudience', 1, statsTag)
    return processPayload(request, audienceSettings, [payload], 'delete')
  },
  performBatch: async (request, { audienceSettings, payload, statsContext }) => {
    const statsClient = statsContext?.statsClient
    const statsTag = statsContext?.tags

    if (!audienceSettings) {
      throw new IntegrationError('Bad Request: no audienceSettings found.', 'INVALID_REQUEST_DATA', 400)
    }

    statsClient?.incr('removeFromAudience', 1, statsTag)
    return processPayload(request, audienceSettings, payload, 'delete')
  }
}

export default action
