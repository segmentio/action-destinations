import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { getTrackEventFields } from '../unified-fields'
import { flattenPayload, flattenPayloadBatch } from '../payload-transformer'
import { TrackEventRequest } from '../request-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Track Event',
  description: 'Send an event to RoadwayAI.',
  defaultSubscription: 'type = "track"',
  fields: getTrackEventFields(),
  perform: async (request, { settings, payload }) => {
    const flattenedPayload = flattenPayload<TrackEventRequest>(payload)

    return request(`https://production.api.roadwayai.com/api/v1/segment/events/track`, {
      method: 'POST',
      headers: {
        'x-api-key': settings.apiKey
      },
      json: [flattenedPayload]
    })
  },

  performBatch: async (request, { settings, payload }) => {
    const transformedPayloads = flattenPayloadBatch<TrackEventRequest[]>(payload)

    return request(`https://production.api.roadwayai.com/api/v1/segment/events/track`, {
      method: 'POST',
      headers: {
        'x-api-key': settings.apiKey
      },
      json: transformedPayloads
    })
  }
}

export default action
