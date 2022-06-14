// import {isObject , isArray} from '@segment/actions-core'
import { isObject } from '@segment/actions-core'
import type { BrowserActionDefinition } from '../../../lib/browser-destinations'
import { Intercom } from '../api'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

// Change from unknown to the partner SDK types
const action: BrowserActionDefinition<Settings, Intercom, Payload> = {
  title: 'Track Event',
  description: '',
  platform: 'web',
  fields: {
    eventName: {
      description: 'The name of the event',
      label: 'Name',
      required: true,
      type: 'string',
      default: {
        '@path': '$.event'
      }
    },
    eventProperties: {
      label: 'Event Parameters',
      description: 'Parameters specific to the event',
      type: 'object',
      default: {
        '@path': '$.properties'
      }
    }
  },
  perform: (Intercom, event) => {
    const payload = event.payload
    const properties = payload.eventProperties

    for (const key in properties) {
      const value = properties[key]
      if (Array.isArray(value) || isObject(value)) {
        delete properties[key]
      }
    }

    Intercom('trackEvent', event.payload.eventName, properties)
  }
}

export default action
