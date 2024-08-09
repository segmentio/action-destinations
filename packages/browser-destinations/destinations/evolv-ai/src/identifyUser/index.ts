import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
import type { Evolv } from '../types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { formatAttributes } from '../utility'
import { __createBinding } from 'tslib'
import { setValues } from '../proxy'

// Change from unknown to the partner SDK types
const action: BrowserActionDefinition<Settings, Evolv, Payload> = {
  title: 'Identify User',
  description: `Send Segment user traits to Evolv AI`,
  defaultSubscription: 'type = "identify"',
  platform: 'web',
  fields: {
    attributes: {
      description: 'JSON object containing additional attributes associated with the user.',
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

    setValues(formattedAttributes)
  }
}

export default action
