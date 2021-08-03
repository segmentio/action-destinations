import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Login',
  description: 'Send login event to GA4',
  defaultSubscription: 'type = "track" and event = "Signed In"',
  fields: {
    client_id: {
      label: 'Client ID',
      description: 'Uniquely identifies a user instance of a web client.',
      type: 'string',
      required: true,
      default: {
        '@if': {
          exists: { '@path': '$.userId' },
          then: { '@path': '$.userId' },
          else: { '@path': '$.anonymousId' }
        }
      }
    },
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
