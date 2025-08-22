import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import type { FUS } from '../types'

type LocalCustomEventData = {
  [key: string]: string | number
  [stringKey: `${string}_str`]: string
  [numberKey: `${string}_real`]: number
}

const action: BrowserActionDefinition<Settings, FUS, Payload> = {
  title: 'Record Event',
  description: 'Send an event to FullSession',
  platform: 'web',
  defaultSubscription: 'type = "track"',
  fields: {
    name: {
      description: 'The name of the event.',
      label: 'Name',
      required: true,
      type: 'string',
      default: {
        '@path': '$.event'
      }
    },
    properties: {
      description: 'A JSON object with information about the event.',
      label: 'Properties',
      required: false,
      type: 'object',
      default: {
        '@path': '$.properties'
      }
    }
  },
  perform: (FUS, data) => {
    const { name, properties } = data.payload
    FUS.event(name, (properties ?? {}) as LocalCustomEventData)
  }
}

export default action
