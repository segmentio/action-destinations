import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import { baseURL, defaultRequestParams } from '../request-params'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Send Event',
  description: 'Send a user event to GWEN',
  defaultSubscription: 'type = "track"',
  fields: {
    userId: {
      type: 'string',
      format: 'uuid',
      required: true,
      description: "The user's id. (Format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)",
      label: 'User ID',
      default: {
        '@path': '$.userId'
      }
    },
    type: {
      label: 'Event Type',
      description: 'The type of the event',
      type: 'string',
      required: true,
      default: {
        '@path': '$.type'
      }
    },
    data: {
      label: 'Data',
      type: 'object',
      required: false,
      description: 'The data to be sent to GWEN',
      default: {
        '@path': '$.properties'
      }
    }
  },
  perform: async (request, { payload }) => {
    const { userId, type, data } = payload

    await request(baseURL, {
      ...defaultRequestParams,
      body: JSON.stringify({
        operationName: 'SendEvent',
        query: `mutation SendEvent($userId: UUID!, $type: String!, $data: JSONObject) {\n event(userId: $userId, type: $type, data: $data)\n}`,
        variables: {
          userId,
          type,
          data: data || {}
        }
      })
    })
  }
}

export default action
