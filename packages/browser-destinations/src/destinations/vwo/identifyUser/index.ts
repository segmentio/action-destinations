import type { BrowserActionDefinition } from '../../../lib/browser-destinations'
import type { VWO } from '../types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { formatAttributes } from '../utility'

// Change from unknown to the partner SDK types
const action: BrowserActionDefinition<Settings, VWO, Payload> = {
  title: 'Identify User',
  description: 'Forwards user traits to VWO Data360 attributes',
  defaultSubscription: 'type = "identify"',
  platform: 'web',
  fields: {
    attributes: {
      description: 'A JSON object containing additional attributes that will be associated with the user.',
      label: 'Attributes',
      required: true,
      type: 'object',
      default: {
        '@path': '$.traits'
      }
    }
  },
  perform: (VWO, event) => {
    const { attributes } = event.payload
    const formattedAttributes = formatAttributes(attributes)

    if (!VWO.visitor) {
      return
    }
    VWO.visitor(formattedAttributes, { source: 'segment.web' })
  }
}

export default action
