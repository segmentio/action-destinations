import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import type { Mixpanel } from '../types'

// Change from unknown to the partner SDK types
const action: BrowserActionDefinition<Settings, Mixpanel, Payload> = {
  title: 'Track Page View',
  description: 'Sync Segment page events to Mixpanel.',
  platform: 'web',
  fields: {
    event_name: {
      label: 'Event Name',
      description: 'The name of the event to track in Mixpanel.',
      required: false,
      type: 'string'
    },
    properties: {
      label: 'Properties',
      description: 'The properties to associate with the page event.',
      required: false,
      type: 'object',
      default: {
        '@path': '$.properties'
      }
    },
    // TODO - maybe allow anonymousId and userId in Mixpanel to be set directly from track calls. 
  },
  defaultSubscription: 'type = "page"',
  perform: (mixpanel, { payload }) => {
    const { event_name, properties = {} } = payload
    if(event_name){
        mixpanel.track_pageview(properties || {}, { event_name } )
    } else {
        mixpanel.track_pageview(properties || {})
    }
  }
}

export default action
