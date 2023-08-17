import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import type { LR } from '../types'

type TrackEventProperties = {
  [key: string]: string | number | boolean | string[] | number[] | boolean[] | undefined
}

const action: BrowserActionDefinition<Settings, LR, Payload> = {
  title: 'Track',
  description: 'Send track events to logrocket for filtering and tagging.',
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
      description: 'A JSON object containing additional properties that will be associated with the event.',
      label: 'Properties',
      required: false,
      type: 'object',
      default: {
        '@path': '$.properties'
      }
    }
  },
  perform: (LogRocket, event) => {
    LogRocket.track(event.payload.name, (event.payload.properties as TrackEventProperties) ?? {})
  }
}

export default action
