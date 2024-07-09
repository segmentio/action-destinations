import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
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
      allowNull: true,
      description: 'The ID associated with the user',
      label: 'User ID',
      default: { '@path': '$.userId' }
    },
    groupId: {
      type: 'string',
      required: false,
      allowNull: true,
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
    },
    context: {
      type: 'object',
      label: 'Context',
      description: 'Device context',
      required: false,
      default: { '@path': '$.context' }
    }
  },
  perform: async (ripe, { payload }) => {
    return ripe.identify({
      messageId: payload.messageId,
      anonymousId: payload.anonymousId,
      userId: payload.userId,
      groupId: payload.groupId,
      traits: payload.traits,
      context: payload.context
    })
  }
}

export default action
