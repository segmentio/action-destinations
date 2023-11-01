import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
import { _1Flow } from '../api'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: BrowserActionDefinition<Settings, _1Flow, Payload> = {
  title: 'Track Event',
  description: 'Submit an event to 1Flow.',
  defaultSubscription: 'type = "track"',
  platform: 'web',
  fields: {
    event_name: {
      description: 'The name of the event.',
      label: 'Event Name',
      type: 'string',
      required: true,
      default: {
        '@path': '$.event'
      }
    }
  },
  perform: (_1Flow, event) => {
    const { event_name } = event.payload
    const richLinkProperties = _1Flow.richLinkProperties ? _1Flow.richLinkProperties : []
    //API call
    _1Flow('track', event_name, {
      ...richLinkProperties
    })
  }
}

export default action
