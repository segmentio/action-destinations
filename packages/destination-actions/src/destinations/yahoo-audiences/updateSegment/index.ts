import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { gen_update_segment_payload } from '../utils-rt'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Sync To Yahoo Ads Segment',
  description: 'Sync Segment Audience to Yahoo Ads Segment',
  defaultSubscription: 'event = "Audience Entered" and event = "Audience Exited"',
  fields: {
    segment_audience_id: {
      label: 'Segment Audience Id', // Maps to Yahoo Taxonomy Segment Id
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
      description: 'Send mobile advertising ID (IDFA, AAID or GAID) to Yahoo. Segment will hash MAIDs',
      type: 'boolean',
      default: true
    },
    send_email: {
      label: 'Send User Email',
      description: 'Send user email to Yahoo. Segment will hash emails',
      type: 'boolean',
      default: true
    },
    gdpr_flag: {
      label: 'GDPR Flag',
      description: 'Set to true to indicate that audience data is subject to GDPR regulations',
      type: 'boolean',
      default: false
    },
    gdpr_euconsent: {
      label: 'GDPR Consent Attributes',
      description:
        'Required if GDPR flag is set to "true". Using IAB Purpose bit descriptions specify the following user consent attributes: "Storage and Access of Information", "Personalization"',
      type: 'string',
      required: false
    }
  },

  // We should batch requests at all times, so perform is won't likely run. Should I remove it?
  perform: (request, { payload, auth }) => {
    console.log('updateSegment > perform')
    if (auth?.accessToken) {
      console.log('access token obj is avail')
      const creds = Buffer.from(auth?.accessToken, 'base64').toString()
      const creds_json = JSON.parse(creds)
      const rt_access_token = creds_json.rt
      const body = gen_update_segment_payload([payload])
      console.log(JSON.stringify(body))
      return request('https://dataxonline.yahoo.com/online/audience/', {
        method: 'POST',
        json: body,
        headers: {
          Authorization: `Bearer ${rt_access_token}`
        }
      })
    } else {
      console.log('updateSegment > perform: no auth access_token')
    }
  },
  performBatch: (request, { payload, auth }) => {
    console.log('updateSegment > performBatch')
    if (auth?.accessToken) {
      console.log('access token obj is avail')
      const body = gen_update_segment_payload(payload)
      console.log(JSON.stringify(body))
      const creds = Buffer.from(auth?.accessToken, 'base64').toString()
      const creds_json = JSON.parse(creds)
      const rt_access_token = creds_json.rt
      return request('https://dataxonline.yahoo.com/online/audience/', {
        method: 'POST',
        json: body,
        headers: {
          Authorization: `Bearer ${rt_access_token}`
        }
      })
    } else {
      console.log('updateSegment > performBatch: no auth access_token')
    }
  }
}

export default action
