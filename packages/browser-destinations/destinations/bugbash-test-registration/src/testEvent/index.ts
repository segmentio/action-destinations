import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: BrowserActionDefinition<Settings, unknown, Payload> = {
  title: 'Test Event',
  description: 'Scratch test action for a bug-bash browser-destination registration test.',
  defaultSubscription: 'type = "track"',
  platform: 'web',
  fields: {
    message: {
      label: 'Message',
      description: 'A test message field.',
      type: 'string',
      required: false
    }
  },
  perform: (_client, event) => {
    // eslint-disable-next-line no-console
    console.log('bugbash test event', event.payload.message)
  }
}

export default action
