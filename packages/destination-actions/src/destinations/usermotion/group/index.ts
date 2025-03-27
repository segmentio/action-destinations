import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Identify Company',
  description: 'Create or update a company in UserMotion',
  defaultSubscription: 'type = "group"',
  fields: {
    userId: {
      type: 'string',
      description: 'A identifier for a known user.',
      label: 'User ID',
      required: false,
      default: { '@path': '$.userId' }
    },
    anonymousId: {
      type: 'string',
      required: false,
      description: 'An identifier for an anonymous user',
      label: 'Anonymous ID',
      default: { '@path': '$.anonymousId' }
    },
    groupId: {
      type: 'string',
      description: 'A identifier for a known company.',
      label: 'Group ID',
      required: true,
      default: { '@path': '$.groupId' }
    },
    traits: {
      type: 'object',
      label: 'Traits',
      description: 'Traits to associate with the company',
      default: { '@path': '$.traits' }
    }
  },
  perform: (request, { payload }) => {
    return request('https://api.usermotion.com/v1/group', {
      method: 'post',
      json: {
        id: payload.groupId,
        userId: payload.userId,
        anonymousId: payload.anonymousId,

        properties: {
          ...payload.traits
        }
      }
    })
  }
}

export default action
