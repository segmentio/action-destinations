import type { BrowserActionDefinition } from '../../../lib/browser-destinations'
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
    },
    category: {
      type: 'string',
      required: false,
      description: 'The category of the page',
      label: 'Category',
      default: { '@path': '$.category' }
    },
    name: {
      type: 'string',
      required: false,
      description: 'The name of the page',
      label: 'Name',
      default: { '@path': '$.name' }
    },
    properties: {
      type: 'object',
      required: false,
      description: 'Page properties',
      label: 'Properties',
      default: { '@path': '$.properties' }
    }
  },
  perform: async (ripe, { payload }) => {
    await ripe.setIds(payload.anonymousId, payload.userId, payload.groupId)
    return ripe.page(payload.category, payload.name, payload.properties)
  }
}

export default action
