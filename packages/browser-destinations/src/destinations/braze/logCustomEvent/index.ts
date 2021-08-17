import type { BrowserActionDefinition } from '../../../lib/browser-destinations'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import type appboy from '@braze/web-sdk'
import { omit } from '@segment/actions-core'

const action: BrowserActionDefinition<Settings, typeof appboy, Payload> = {
  title: 'Log Custom Event',
  description: 'Reports that the current user performed a custom named event.',
  defaultSubscription: 'type = "track"',
  platform: 'web',
  fields: {
    eventName: {
      type: 'string',
      required: true,
      description: 'The identifier for the event to track.',
      label: 'eventName',
      default: {
        '@path': '$.event'
      }
    },
    eventProperties: {
      type: 'object',
      required: false,
      description: 'Hash of properties for this event.',
      label: 'eventProperties',
      default: {
        '@path': '$.properties'
      }
    }
  },
  perform: (client, event) => {
    const reservedKeys = Object.keys(action.fields.products.properties ?? {})
    const properties = omit(event.payload.eventProperties, reservedKeys)
    client.logCustomEvent(event.payload.eventName, properties)
  }
}

export default action
