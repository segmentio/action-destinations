import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const payloadTransform = (payload: Payload) => {
  /**
   * TODO:
   * Transform payload to drop nested traits
   * Decide if those should be flattened like
   * {
   *   "trait1": {
   *      "subTrait1": true
   *   }
   * }
   * ---to---
   * "trait1.subTrait1": true
   */
  return payload
}

const action: ActionDefinition<Settings, Payload> = {
  title: 'Identify User',
  description: 'Upserts a user along with any traits to the Sprig platform.',
  fields: {
    userId: {
      description: 'The userId of the identified user.',
      label: 'User ID',
      required: true,
      type: 'string',
      default: {
        '@path': '$.userId'
      }
    },
    attributes: {
      description: 'The traits payload to attribute to the userId.',
      label: 'Attributes',
      required: true,
      type: 'object',
      default: {
        '@path': '$.traits'
      }
    }
  },
  perform: (request, data) => {
    // Make your partner api request here!
    // return request('https://example.com', {
    //   method: 'post',
    //   json: data.payload
    // })
    return request('https://api.sprig.com/v2/users', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${data.settings.apiKey}`
      },
      json: payloadTransform(data.payload)
    })
  }
}

export default action
