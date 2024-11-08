import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { commonFields } from '../common-fields'
import { endpointUrl } from '../utils'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Page',
  description: 'Send page events to Accoil',
  defaultSubscription: 'type = "page"',
  fields: {
    userId: {
      type: 'string',
      description: 'The ID associated with the user',
      label: 'User ID',
      default: { '@path': '$.userId' }
    },
    name: {
      type: 'string',
      required: false,
      description: 'The name of the page',
      label: 'Page Name',
      default: { '@path': '$.name' }
    },
    timestamp: commonFields.timestamp
  },
  perform: (request, { payload, settings }) => {
    return request(endpointUrl(settings.api_key), {
      method: 'post',
      json: {
        type: 'page',
        userId: payload.userId,
        name: payload.name,
        timestamp: payload.timestamp
      }
    })
  }
}

export default action
