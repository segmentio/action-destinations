import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { params, user_id, client_id } from '../ga4-properties'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Sign Up',
  description: 'Send event when a user signs up to measure the popularity of each sign-up method',
  defaultSubscription: 'type = "track" and event = "Signed Up"',
  fields: {
    client_id: { ...client_id },
    user_id: { ...user_id },
    method: {
      label: 'Method',
      description: 'The method used for sign up.',
      type: 'string',
      default: {
        '@path': `$.properties.type`
      }
    },
    params: params
  },
  perform: (request, { payload }) => {
    return request('https://www.google-analytics.com/mp/collect', {
      method: 'POST',
      json: {
        client_id: payload.client_id,
        user_id: payload.user_id,
        events: [
          {
            name: 'sign_up',
            params: {
              method: payload.method,
              ...payload.params
            }
          }
        ]
      }
    })
  }
}

export default action
