import type { BrowserActionDefinition } from '../../../lib/browser-destinations'
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
    }
  },
  perform: async (ripe, { payload }) => {
    await ripe.setIds(payload.anonymousId, payload.userId, payload.groupId)
    if (payload?.event) {
      return ripe.track(payload.event, payload.properties)
    }
  }
}

export default action
