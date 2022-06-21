import { isArray, isObject } from '@segment/actions-core'
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
    event_name: {
      description: 'The name of the event',
      label: 'Name',
      required: true,
      type: 'string',
      default: {
        '@path': '$.event'
      }
    },
    event_properties: {
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
    const properties = payload.event_properties
    const richLinkProperties = Intercom.richLinkProperties

    for (const key in properties) {
      const value = properties[key]
      //filter out arrays and objects that are not richLinkProperties
      if (isArray(value) || isObject(value)) {
        if (isObject(value) && richLinkProperties?.includes(key)) continue
        delete properties[key]
      }
    }

    Intercom('trackEvent', event.payload.event_name, properties)
  }
}

export default action
