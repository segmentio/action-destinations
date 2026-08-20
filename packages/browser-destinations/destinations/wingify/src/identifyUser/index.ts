import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
import type { Wingify } from '../types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { formatAttributes } from '../utility'

const action: BrowserActionDefinition<Settings, Wingify, Payload> = {
  title: 'Identify User',
  description: `Sends Segment's user traits to Wingify`,
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

    window.Wingify = window.Wingify || []

    window.Wingify.visitor =
      window.Wingify.visitor ||
      function (...args) {
        window.Wingify.push(['visitor', ...args])
      }

    window.Wingify.visitor(formattedAttributes, { source: 'segment.web' })
  }
}

export default action
