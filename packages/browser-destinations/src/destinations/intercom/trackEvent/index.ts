import type { BrowserActionDefinition } from '../../../lib/browser-destinations'
import { Intercom } from '../api'
import type { Settings } from '../generated-types'
import { filterCustomTraits } from '../utils'
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
    event_metadata: {
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
    const metadata = payload.event_metadata
    const richLinkProperties = Intercom.richLinkProperties

    // create a list of the richLinkObjects that will be passed to Intercom
    const richLinkObjects: Array<{ [k: string]: unknown }> = []
    if (metadata && richLinkProperties) {
      for (const [key, value] of Object.entries(metadata)) {
        if (richLinkProperties?.includes(key)) {
          richLinkObjects.push({ key: value })
        }
      }
    }

    //filters out all objects & arrays
    const filteredMetadata = metadata ? filterCustomTraits([], metadata) : {}

    //rejoin richLinkObjects in the final payload
    //API CALL
    Intercom('trackEvent', payload.event_name, {
      ...filteredMetadata,
      ...richLinkObjects
    })
  }
}

export default action
