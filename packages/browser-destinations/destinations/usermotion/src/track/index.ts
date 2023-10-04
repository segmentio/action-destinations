import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import type { UserMotion } from '../types'

const action: BrowserActionDefinition<Settings, UserMotion, Payload> = {
  title: 'Track Event',
  description: 'Send user events to UserMotion',
  defaultSubscription: 'type = "track"',
  platform: 'web',
  fields: {
    event: {
      type: 'string',
      required: true,
      description: 'Event name.',
      label: 'Event Name',
      default: { '@path': '$.event' }
    },
    properties: {
      type: 'object',
      required: false,
      description: 'Properties to send with the event.',
      label: 'Event Properties',
      default: { '@path': '$.properties' }
    }
  },
  perform: (UserMotion, event) => {
    const { event: eventName, properties } = event.payload
    if (!eventName) return

    const props = typeof properties === 'object' ? { ...properties } : undefined

    UserMotion.track(eventName, props)
  }
}
export default action
