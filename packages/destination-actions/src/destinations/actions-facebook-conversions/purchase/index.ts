import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Purchase',
  description: 'Send a purchase event to FB',
  fields: {
    currency: {
      label: 'Currency',
      description: 'currency',
      required: true,
      type: 'string'
    },
    value: {
      label: 'Value',
      description: 'value',
      required: true,
      type: 'string'
    }
  },
  perform: (request, { payload, settings }) => {
    console.log('payload', payload)

    return request(`https://graph.facebook.com/v11.0/${settings.pixelId}/events?access_token=${settings.token}`, {
      method: 'POST',
      json: {
        data: [
          {
            event_name: 'Purchase',
            event_time: 1629827640,
            action_source: 'email',
            user_data: {
              em: ['7b17fb0bd173f625b58636fb796407c22b3d16fc78302d79f0fd30c2fc2fc068'],
              ph: [null]
            },
            custom_data: {
              currency: payload.currency,
              value: payload.value
            }
          }
        ]
      }
    })
  }
}

export default action
