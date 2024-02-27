import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { RipeSDK } from '../types'

const action: BrowserActionDefinition<Settings, RipeSDK, Payload> = {
  title: 'Page',
  description: 'Register page view in Ripe',
  defaultSubscription: 'type = "page"',
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
    category: {
      type: 'string',
      required: false,
      description: 'The category of the page',
      label: 'Category',
      default: {
        '@if': {
          exists: { '@path': '$.category' },
          then: { '@path': '$.category' },
          else: { '@path': '$.context.category' }
        }
      }
    },
    name: {
      type: 'string',
      required: false,
      description: 'The name of the page',
      label: 'Name',
      default: {
        '@if': {
          exists: { '@path': '$.name' },
          then: { '@path': '$.name' },
          else: { '@path': '$.context.name' }
        }
      }
    },
    properties: {
      type: 'object',
      required: false,
      description: 'Page properties',
      label: 'Properties',
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
    return ripe.page({
      messageId: payload.messageId,
      anonymousId: payload.anonymousId,
      userId: payload.userId,
      groupId: payload.groupId,
      category: payload.category,
      name: payload.name,
      properties: payload.properties
    })
  }
}

export default action
