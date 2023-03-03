import type { BrowserActionDefinition } from '../../../lib/browser-destinations'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { RipeSDK } from '../types'

const action: BrowserActionDefinition<Settings, RipeSDK, Payload> = {
  title: 'Identify',
  description: 'Identify user in Ripe',
  defaultSubscription: 'type = "identify"',
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
      required: false,
      description: 'The ID associated groupId',
      label: 'Group ID',
      default: { '@path': '$.context.groupId' }
    },
    traits: {
      type: 'object',
      label: 'Traits',
      description: 'Traits to associate with the user',
      required: false,
      default: { '@path': '$.traits' }
    },
    messageId: {
      type: 'string',
      required: false,
      description: 'The Segment messageId',
      label: 'MessageId',
      default: { '@path': '$.messageId' }
    }
  },
  perform: async (ripe, { payload }) => {
    await ripe.setIds(payload.anonymousId, payload.userId, payload.groupId)
    return ripe.identify({ messageId: payload.messageId, userId: payload.userId, traits: payload.traits })
  }
}

export default action
