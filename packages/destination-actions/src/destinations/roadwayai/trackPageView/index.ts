import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { getTrackPageViewFields } from '../unified-fields'
import { flattenPayload, flattenPayloadBatch } from '../payload-transformer'
import { TrackPageViewRequest } from '../request-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Track Page View',
  description: 'Forward page view event to RoadwayAI.',
  defaultSubscription: 'type = "page"',
  fields: getTrackPageViewFields(),
  perform: async (request, { settings, payload }) => {
    const flattenedPayload = flattenPayload<TrackPageViewRequest>(payload)
    return request(`https://production.api.roadwayai.com/api/v1/segment/events/page`, {
      method: 'POST',
      headers: {
        'x-api-key': settings.apiKey
      },
      json: [flattenedPayload]
    })
  },

  performBatch: async (request, { settings, payload }) => {
    const transformedPayloads = flattenPayloadBatch<TrackPageViewRequest[]>(payload)

    return request(`https://production.api.roadwayai.com/api/v1/segment/events/page`, {
      method: 'POST',
      headers: {
        'x-api-key': settings.apiKey
      },
      json: transformedPayloads
    })
  }
}

export default action
