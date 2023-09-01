import type { ActionDefinition } from '@segment/actions-core'
import type { Settings, AudienceSettings } from '../generated-types'
import type { Payload } from './generated-types'
import { processPayload } from '../functions'
import {
  email,
  advertising_id,
  send_email,
  send_advertising_id,
  event_name,
  enable_batching,
  external_audience_id
} from '../properties'
import { IntegrationError } from '@segment/actions-core'
import { MIGRATION_FLAG_NAME } from '../constants'

const action: ActionDefinition<Settings, Payload, AudienceSettings> = {
  title: 'Add to Audience',
  description: 'Add records from an Engage Audience to a TikTok Audience Segment.',
  defaultSubscription: 'event = "Audience Entered"',
  fields: {
    email: { ...email },
    advertising_id: { ...advertising_id },
    send_email: { ...send_email },
    send_advertising_id: { ...send_advertising_id },
    event_name: { ...event_name },
    enable_batching: { ...enable_batching },
    external_audience_id: { ...external_audience_id }
  },
  perform: async (request, { audienceSettings, payload, statsContext, features }) => {
    // This flag hides mapping but we want to ensure the mappings are also not run.
    if (features && !features[MIGRATION_FLAG_NAME]) {
      return
    }
    const statsClient = statsContext?.statsClient
    const statsTag = statsContext?.tags

    if (!audienceSettings) {
      throw new IntegrationError('Bad Request: no audienceSettings found.', 'INVALID_REQUEST_DATA', 400)
    }

    if (statsClient) {
      statsClient?.incr('addToAudience', 1, statsTag)
    }

    return processPayload(request, audienceSettings, [payload], 'add')
  },
  performBatch: async (request, { payload, audienceSettings, statsContext, features }) => {
    // This flag hides mapping but we want to ensure the mappings are also not run.
    if (features && !features[MIGRATION_FLAG_NAME]) {
      return
    }
    const statsClient = statsContext?.statsClient
    const statsTag = statsContext?.tags

    if (!audienceSettings) {
      throw new IntegrationError('Bad Request: no audienceSettings found.', 'INVALID_REQUEST_DATA', 400)
    }

    if (statsClient) {
      statsClient?.incr('addToAudience', 1, statsTag)
    }

    return processPayload(request, audienceSettings, payload, 'add')
  }
}

export default action
