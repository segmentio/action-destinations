import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
import type { VWO } from '../types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { formatAttributes } from '../utility'

// Change from unknown to the partner SDK types
const action: BrowserActionDefinition<Settings, VWO, Payload> = {
  title: 'Identify User',
  description: `Sends Segment's page event to VWO`,
  defaultSubscription: 'type = "identify"',
  platform: 'web',
  fields: {
    attributes: {
      description: 'JSON object containing additional attributes that will be associated with the user.',
      label: 'Attributes',
      required: true,
      type: 'object',
      default: {
        '@path': '$.traits'
      }
    }
  },
  perform: (_, event) => {
    const { attributes } = event.payload
    const formattedAttributes = formatAttributes(attributes)

    window.VWO = window.VWO || []

    if (!window.VWO.visitor) {
      window.VWO.visitor = function (...args) {
        window.VWO.push(['visitor', ...args])
      }
    }

    window.VWO.visitor(formattedAttributes, { source: 'segment.web' })
  }
}

export default action
