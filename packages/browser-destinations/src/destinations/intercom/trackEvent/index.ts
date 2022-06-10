import type { BrowserActionDefinition } from '../../../lib/browser-destinations'
import { Intercom } from '../api'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

// Change from unknown to the partner SDK types
const action: BrowserActionDefinition<Settings, Intercom, Payload> = {
  title: 'Track Event',
  description: '',
  platform: 'web',
  fields: {
    eventName: {
      description: 'The name of the event',
      label: 'Name',
      required: true,
      type: 'string',
      default: {
        '@path' : '$.event'
      }
    },
    eventProperties : {
      label: 'Event Parameters',
      description: 'Parameters specific to the event',
      type: 'object',
      default: {
        '@path' : '$.properties'
      }
    }
  },
  perform: (Intercom, event) => {
    const payload = event.payload
    let properties = event.payload.eventProperties

    if(properties && properties.revenue){
      const revenue : any = properties.revenue;
      const revenueData = {
        price: {
          amount: revenue * 100,
          currency: properties.currency
        }
      }

      properties = {...properties, ...revenueData}
      delete properties.revenue
      delete properties.currency
    }
  
    Intercom('trackEvent', payload.eventName, properties)
  }
}

export default action
