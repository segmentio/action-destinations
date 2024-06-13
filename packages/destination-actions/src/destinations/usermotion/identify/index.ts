import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Identify',
  description: 'Identify user in UserMotion',
  defaultSubscription: 'type = "identify"',
  fields: {
    userId: {
      type: 'string',
      description: 'A identifier for a known user.',
      label: 'User ID',
      required: true,
      default: { '@path': '$.userId' }
    },
    anonymousId: {
      type: 'string',
      required: false,
      description: 'An identifier for an anonymous user',
      label: 'Anonymous ID',
      default: { '@path': '$.anonymousId' }
    },
    email: {
      type: 'string',
      required: true,
      label: 'Email',
      description: 'The email address of the identified user',
      default: {
        '@if': {
          exists: { '@path': '$.traits.email' },
          then: { '@path': '$.traits.email' },
          else: { '@path': '$.email' }
        }
      }
    },
    traits: {
      type: 'object',
      label: 'Traits',
      description: 'Traits to associate with the user',
      default: { '@path': '$.traits' }
    }
  },
  perform: (request, { payload }) => {
    return request('https://api.usermotion.com/v1/identify', {
      method: 'post',
      json: {
        id: payload.userId,
        anonymousId: payload.anonymousId,
        properties: {
          ...payload.traits,
          email: payload.email
        }
      }
    })
  }
}

export default action
