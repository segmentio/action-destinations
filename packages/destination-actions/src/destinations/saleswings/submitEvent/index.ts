import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { convertEvent, convertEventBatch } from './converter'
import { apiBaseUrl } from '../api'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Submit Event',
  description: '',
  fields: {
    customEventPropertyMapping: {
      label: 'Custom Event Properties',
      description:
        'Control how Segment Track events are mapped to SalesWings custom events. In SalesWings, custom events are displayed and evaluated in the Rule Engine as "[Name] Payload", where "Name" is the name of the event and "Payload" is a string representing any event specific information. SalesWings Falcon Engine allows you to define rules based on this representation. To control how it is formed, provide the Segment Track event name on the left-hand side and the Track event property name on the right side. For example, Segment Track event "User Registered" with property "plan" set to "Pro Annual" will be formatted as SalesWings custom event "[User Registered] Pro Annual" if you configure "User Registered" on the left-side and "plan" on the right side',
      type: 'object',
      defaultObjectUI: 'keyvalue:only'
    },
    userId: {
      label: 'Segment User ID',
      description: 'Permanent identifier of a Segment user the event is attributed to',
      type: 'string',
      dynamic: true,
      default: {
        '@path': '$.userId'
      }
    },
    anonymousId: {
      label: 'Segment Anonymous User ID',
      description: 'A pseudo-unique substitute for a Segment user ID the event is attributed to',
      type: 'string',
      default: {
        '@path': '$.anonymousId'
      }
    },
    email: {
      label: 'Email',
      description: 'Identified email of the Segment User',
      type: 'string',
      default: {
        '@path': '$.traits.email'
      }
    },
    type: {
      label: 'Event Type',
      description: 'Type of the event',
      type: 'string',
      default: {
        '@path': '$.type'
      }
    },
    url: {
      label: 'URL',
      description: 'URL associated with the Page event',
      type: 'string',
      default: {
        '@path': '$.properties.url'
      }
    },
    referrerUrl: {
      label: 'Referrer URL',
      description: 'Referrer URL associated with the Page event',
      type: 'string',
      default: {
        '@path': '$.properties.referrer'
      }
    },
    contextUrl: {
      label: 'Context URL',
      description: 'URL associated with the event in the event context',
      type: 'string',
      default: {
        '@path': '$.context.page.url'
      }
    },
    contextReferrerUrl: {
      label: 'Context Referrer URL',
      description: 'Referrer URL associated with the event in the event context',
      type: 'string',
      default: {
        '@path': '$.context.page.referrer'
      }
    },
    userAgent: {
      label: 'User Agent',
      description: 'User Agent associated with the event',
      type: 'string',
      default: {
        '@path': '$.context.userAgent'
      }
    },
    timestamp: {
      label: 'Event timestamp',
      description: 'When the event was sent',
      type: 'datetime',
      default: {
        '@path': '$.timestamp'
      }
    },
    eventName: {
      label: 'Event Name',
      description: 'Name of the Track event',
      type: 'string',
      default: {
        '@path': '$.event'
      }
    },
    screenName: {
      label: 'Screen Name',
      description: 'Screen name of the Screen event',
      type: 'string',
      default: {
        '@path': '$.name'
      }
    },
    properties: {
      label: 'Event Properties',
      description: 'Properties of the Track event',
      type: 'object',
      default: {
        '@path': '$.properties'
      }
    },
    traits: {
      label: 'Event Traits',
      description: 'Traits of the Identify event',
      type: 'object',
      default: {
        '@path': '$.traits'
      }
    }
  },
  perform: (request, data) => {
    const event = convertEvent(data.payload)
    if (!event) return
    return request(`${apiBaseUrl}/events`, {
      method: 'post',
      json: event,
      headers: { Authorization: `Bearer ${data.settings.apiKey}` }
    })
  },
  performBatch: (request, data) => {
    const batch = convertEventBatch(data.payload)
    if (!batch) return
    return request(`${apiBaseUrl}/events/batches`, {
      method: 'post',
      json: batch,
      headers: { Authorization: `Bearer ${data.settings.apiKey}` }
    })
  }
}

export default action
