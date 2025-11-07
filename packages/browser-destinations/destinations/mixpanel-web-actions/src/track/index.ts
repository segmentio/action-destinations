import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import type { Mixpanel } from '../types'

const action: BrowserActionDefinition<Settings, Mixpanel, Payload> = {
  title: 'Track',
  description: 'Sync Segment track events to Mixpanel.',
  platform: 'web',
  fields: {
    event_name: {
      label: 'Event Name',
      description: 'The name of the event to track in Mixpanel.',
      required: true,
      type: 'string',
      default: {
        '@path': '$.event'
      }
    },
    properties: {
      label: 'Properties',
      description: 'The properties to associate with the event.',
      required: false,
      type: 'object',
      default: {
        '@path': '$.properties'
      }
    },
    // TODO - maybe allow anonymousId and userId in Mixpanel to be set directly from track calls. 
  },
  defaultSubscription: 'type = "track"',
  perform: (mixpanel, { payload }) => {
    const { event_name, properties = {} } = payload
    mixpanel.track(event_name, properties)
  }
}

export default action
