import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import type { Appcues } from '../types'
import { flatten } from '../functions'

const action: BrowserActionDefinition<Settings, Appcues, Payload> = {
  title: 'Identify',
  description: 'Send Segment identify events to Appcues.',
  platform: 'web',
  fields: {
    userId: {
      label: 'User ID',
      description: 'The ID of the user to identify in Appcues.',
      required: true,
      type: 'string',
      default: { '@path': '$.userId' }
    },
    traits: {
      label: 'User traits',
      description: 'Properties to associate with the user.',
      required: false,
      type: 'object',
      default: { '@path': '$.traits' }
    }
  },
  defaultSubscription: 'type = "identify"',
  perform: (appcues, { payload }) => {
    const { userId, traits } = payload
    const traitsFlattened = flatten(traits || {})
    appcues.identify(userId, traitsFlattened)
  }
}

export default action
