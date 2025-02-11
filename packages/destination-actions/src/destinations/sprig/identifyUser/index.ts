import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { payloadTransform } from './utils'

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
      description: 'The traits to attribute to the userId.',
      label: 'Attributes',
      required: false,
      type: 'object',
      default: {
        '@path': '$.traits'
      }
    }
  },
  perform: (request, data) => {
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
