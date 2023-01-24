import type { BrowserActionDefinition } from '../../../lib/browser-destinations'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { RipeSDK } from '../types'

const action: BrowserActionDefinition<Settings, RipeSDK, Payload> = {
  title: 'Group',
  description: 'Group user in Ripe',
  defaultSubscription: 'type = "group"',
  platform: 'web',
  fields: {
    anonymousId: {
      type: 'string',
      required: true,
      description: 'The anonymous id',
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
      required: true,
      description: 'The ID associated groupId',
      label: 'Group ID',
      default: { '@path': '$.groupId' }
    },
    traits: {
      type: 'object',
      label: 'Traits',
      description: 'Traits to associate with the group',
      required: false,
      default: { '@path': '$.traits' }
    }
  },
  perform: async (ripe, { payload }) => {
    await ripe.setIds(payload.anonymousId, payload.userId, payload.groupId)
    return ripe.group(payload.groupId, payload.traits)
  }
}

export default action
