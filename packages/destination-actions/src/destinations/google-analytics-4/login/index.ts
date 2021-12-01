import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { client_id } from '../ga4-properties'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Login',
  description: 'Send event when a user logs in',
  defaultSubscription: 'type = "track" and event = "Signed In"',
  fields: {
    client_id: { ...client_id },
    method: {
      label: 'Method',
      type: 'string',
      description: 'The method used to login.'
    }
  },

  perform: (request, { payload }) => {
    return request('https://www.google-analytics.com/mp/collect', {
      method: 'POST',
      json: {
        client_id: payload.client_id,
        events: [
          {
            name: 'login',
            params: {
              method: payload.method
            }
          }
        ]
      }
    })
  }
}

export default action
