import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
import type { Evolv } from '../types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { formatAttributes } from '../utility'
import { __createBinding } from 'tslib'
import { setUser, setValues } from '../proxy'

// Change from unknown to the partner SDK types
const action: BrowserActionDefinition<Settings, Evolv, Payload> = {
  title: 'Identify User',
  description: `Send Segment user traits to Evolv AI`,
  defaultSubscription: 'type = "identify"',
  platform: 'web',
  fields: {
    attributes: {
      description: 'Object containing additional attributes associated with the user.',
      label: 'Attributes',
      required: true,
      type: 'object',
      default: {
        '@path': '$.traits'
      }
    },
    userId: {
      type: 'string',
      required: false,
      description: 'Unique identifier for the user',
      label: 'User ID',
      default: {
        '@path': '$.userId'
      }
    },
    anonymousId: {
      type: 'string',
      required: false,
      description: 'Anonymous identifier for the user',
      label: 'Anonymous ID',
      default: {
        '@path': '$.anonymousId'
      }
    }
  },
  perform: (_, event) => {
    const { attributes, anonymousId } = event.payload
    const formattedAttributes = formatAttributes(attributes)

    if (anonymousId) {
      setUser(anonymousId)
    }

    setValues(formattedAttributes)
  }
}

export default action
