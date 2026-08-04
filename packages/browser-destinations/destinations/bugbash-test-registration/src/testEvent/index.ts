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
    },
    // SCRATCH TEST FIELDS — bug bash test: verify the browser action-field update/push
    // path (never exercised before now, since registration doesn't sync actions).
    count: {
      label: 'Count',
      description: 'A test numeric field.',
      type: 'number',
      required: false
    },
    isTest: {
      label: 'Is Test',
      description: 'A test boolean field.',
      type: 'boolean',
      required: false,
      default: true
    },
    properties: {
      label: 'Properties',
      description: 'A test object field.',
      type: 'object',
      required: false
    }
  },
  perform: (_client, event) => {
    // eslint-disable-next-line no-console
    console.log('bugbash test event', event.payload.message)
  }
}

export default action
