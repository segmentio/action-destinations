import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { getIdentifyUserFields } from '../unified-fields'
import { flattenPayload, flattenPayloadBatch } from '../payload-transformer'
import { IdentifyUserRequest } from '../request-types'
import { ROADWAYAI_API_VERSION } from '../../versioning-info'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Identify User',
  description: 'Set the user ID for a particular device ID or update user properties.',
  defaultSubscription: 'type = "identify"',
  fields: getIdentifyUserFields(),
  perform: async (request, { settings, payload }) => {
    const flattenedPayload = flattenPayload<IdentifyUserRequest>(payload)
    return request(`https://production.api.roadwayai.com/api/${ROADWAYAI_API_VERSION}/segment/events/identify`, {
      method: 'POST',
      headers: {
        'x-api-key': settings.apiKey
      },
      json: [flattenedPayload]
    })
  },

  performBatch: async (request, { settings, payload }) => {
    const transformedPayloads = flattenPayloadBatch<IdentifyUserRequest[]>(payload)

    return request(`https://production.api.roadwayai.com/api/${ROADWAYAI_API_VERSION}/segment/events/identify`, {
      method: 'POST',
      headers: {
        'x-api-key': settings.apiKey
      },
      json: transformedPayloads
    })
  }
}

export default action
