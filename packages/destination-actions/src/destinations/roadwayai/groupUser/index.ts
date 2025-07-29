import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { getGroupUserFields } from '../unified-fields'
import { flattenPayload, flattenPayloadBatch } from '../payload-transformer'
import { GroupUserRequest } from '../request-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Group User',
  description: 'Forward group event to RoadwayAI.',
  defaultSubscription: 'type = "group"',
  fields: getGroupUserFields(),
  perform: async (request, { settings, payload }) => {
    const flattenedPayload = flattenPayload<GroupUserRequest>(payload)
    return request(`https://production.api.roadwayai.com/api/v1/segment/events/group`, {
      method: 'POST',
      headers: {
        'x-api-key': settings.apiKey
      },
      json: [flattenedPayload]
    })
  },

  performBatch: async (request, { settings, payload }) => {
    const transformedPayloads = flattenPayloadBatch<GroupUserRequest[]>(payload)

    return request(`https://production.api.roadwayai.com/api/v1/segment/events/group`, {
      method: 'POST',
      headers: {
        'x-api-key': settings.apiKey
      },
      json: transformedPayloads
    })
  }
}

export default action
