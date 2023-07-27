import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { RipeSDK } from '../types'

const action: BrowserActionDefinition<Settings, RipeSDK, Payload> = {
  title: 'Track',
  description: 'Send user events to Ripe',
  defaultSubscription: 'type = "track"',
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
    event: {
      type: 'string',
      required: true,
      description: 'The event name',
      label: 'Event Name',
      default: { '@path': '$.event' }
    },
    properties: {
      type: 'object',
      required: false,
      description: 'Properties to send with the event',
      label: 'Event properties',
      default: { '@path': '$.properties' }
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
    if (payload?.event) {
      return ripe.track({
        messageId: payload.messageId,
        anonymousId: payload.anonymousId,
        userId: payload.userId,
        groupId: payload.groupId,
        event: payload.event,
        properties: payload.properties
      })
    }
  }
}

export default action
