import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Sync To Yahoo Ads Segment',
  description: 'Sync Segment Audience to Yahoo Ads Segment',
  defaultSubscription: 'event = "Audience Entered" and event = "Audience Exited"',
  fields: {
    segment_audience_id: {
      label: 'Segment Audience Id', // Maps to Yahoo Segment Id
      description: 'Segment Audience Id',
      type: 'hidden',
      required: true,
      default: {
        '@path': '$.context.personas.computation_id'
      }
    },
    segment_audience_key: {
      label: 'Yahoo Segment Key',
      description: 'Segment Audience Key',
      type: 'hidden',
      required: true,
      default: {
        '@path': '$.context.personas.computation_key'
      }
    },
    email: {
      label: 'User Email',
      description: "The user's email address to send to LinkedIn.",
      type: 'hidden',
      default: {
        '@path': '$.context.traits.email'
      }
    },
    event_name: {
      label: 'Event Name', // Determines user membership in the audience
      description: 'The name of the current Segment event.',
      type: 'hidden',
      default: {
        '@path': '$.event'
      }
    },
    enable_batching: {
      label: 'Enable Batching',
      description: 'Enable batching of requests to the LinkedIn DMP Segment.',
      type: 'hidden', // We should always batch Yahoo requests
      default: true
    },
    advertising_id: {
      label: 'User Mobile Advertising ID',
      description: "The user's Mobile Advertising ID",
      type: 'hidden', // This field is hidden from customers because the desired value always appears at path '$.context.device.advertisingId' in Personas events.
      default: {
        '@path': '$.context.device.advertisingId'
      }
    },
    device_type: {
      label: 'User Mobile Device Type', // This field is required to determine the type of the advertising Id: IDFA or GAID
      description: "The user's mobile device type",
      type: 'hidden', // This field is hidden from customers because the desired value always appears at path '$.context.device.advertisingId' in Personas events.
      default: {
        '@path': '$.context.device.type'
      }
    },
    send_advertising_id: {
      label: 'Send Mobile Advertising ID',
      description: 'Send mobile advertising ID (IDFA, AAID or GAID) to Yahoo',
      type: 'boolean',
      default: true
    },
    send_email: {
      label: 'Send User Email',
      description: 'Send user email to Yahoo',
      type: 'boolean',
      default: true
    }
  },

  // We should batch requests at all times
  perform: (request, { payload }) => {
    return request('https://dataxonline.yahoo.com/online/audience/', {
      method: 'POST',
      json: payload
    })
  },
  performBatch: (request, { payload }) => {
    return request('https://dataxonline.yahoo.com/online/audience/', {
      method: 'POST',
      json: payload
    })
  }
}
/*
TODO: 
check if Segment does not exist -- return error, add a note that a user must use CreateSegment mapping 
to create Segment
*/

export default action
