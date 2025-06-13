import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { getIdentifyUserFields } from '../unified-fields'
import { flattenPayload, flattenPayloadBatch } from '../payload-transformer'
import { IdentifyUserRequest } from '../request-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Identify User',
  description: 'Set the user ID for a particular device ID or update user properties.',
  defaultSubscription: 'type = "identify"',
  fields: getIdentifyUserFields(),
  perform: async (request, { settings, payload }) => {
    const flattenedPayload = flattenPayload<IdentifyUserRequest>(payload)
    return request(`https://app.roadwayai.com/api/v1/segment/events/identify`, {
      method: 'POST',
      headers: {
        'x-api-key': settings.apiKey
      },
      json: [flattenedPayload]
    })
  },

  performBatch: async (request, { settings, payload }) => {
    const transformedPayloads = flattenPayloadBatch<IdentifyUserRequest[]>(payload)

    return request(`https://app.roadwayai.com/api/v1/segment/events/identify`, {
      method: 'POST',
      headers: {
        'x-api-key': settings.apiKey
      },
      json: transformedPayloads
    })
  }
}

export default action
