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
  description: `Sends Segment's user traits to Evolv`,
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
    },
    userId: {
      type: 'string',
      description: 'A user’s unique visitor ID. Setting this allows .',
      label: '',
      default: {
        '@if': {
          exists: { '@path': '$.userId' },
          then: { '@path': '$.userId' },
          else: { '@path': '$.anonymousId' }
        }
      }
    }
  },
  perform: (_, event) => {
    const { attributes } = event.payload
    const formattedAttributes = formatAttributes(attributes)
    // const { attributes, ...other } = event.payload
    // const formattedAttributes = formatAttributes(other)

    console.info('evolv identify user called', event)
    // if (evolv && !evolv.instancesCount){
    //   window.evolv.setUid(event.payload.userId);
    // }
    setValues(formattedAttributes)
  }
}

export default action
