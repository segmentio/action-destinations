import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
import { _1flow } from '../api'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: BrowserActionDefinition<Settings, _1flow, Payload> = {
  title: 'Identify User',
  description: 'Create or update a user in 1Flow.',
  defaultSubscription: 'type = "identify"',
  platform: 'web',
  fields: {
    userId: {
      description: 'A unique identifier for the user.',
      label: 'User ID',
      type: 'string',
      required: false,
      default: {
        '@path': '$.userId'
      }
    },
    traits: {
      description: "The user's custom attributes.",
      label: 'Custom Attributes',
      type: 'object',
      required: false,
      defaultObjectUI: 'keyvalue',
      default: {
        '@path': '$.traits'
      }
    }
  },
  perform: (_1flow, event) => {
    const { userId, traits } = event.payload
    _1flow('identify', userId, {
      ...traits
    })
  }
}

export default action
