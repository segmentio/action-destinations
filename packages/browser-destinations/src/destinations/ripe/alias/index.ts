import type { BrowserActionDefinition } from '../../../lib/browser-destinations'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { RipeSDK } from '../types'

const action: BrowserActionDefinition<Settings, RipeSDK, Payload> = {
  title: 'Alias',
  description: 'Alias a user to new user ID in Ripe',
  defaultSubscription: 'type = "alias"',
  platform: 'web',
  fields: {
    anonymousId: {
      type: 'string',
      required: true,
      description: 'The new user ID, if user ID is not set',
      label: 'Anonymous ID',
      default: { '@path': '$.anonymousId' }
    },
    userId: {
      type: 'string',
      required: false,
      description: 'The ID associated with the user',
      label: 'User ID',
      default: { '@path': '$.userId' }
    },
    groupId: {
      type: 'string',
      required: false,
      description: 'The ID associated groupId',
      label: 'Group ID',
      default: { '@path': '$.groupId' }
    }
  },
  perform: async (ripe, { payload }) => {
    await ripe.setIds(payload.anonymousId, payload.userId, payload.groupId)
    if (payload.userId) {
      return ripe.alias(payload.userId)
    }

    if (payload.anonymousId) {
      return ripe.alias(payload.anonymousId)
    }
  }
}

export default action
