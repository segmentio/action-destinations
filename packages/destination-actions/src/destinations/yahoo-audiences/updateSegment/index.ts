import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { gen_update_segment_payload } from '../utils-rt'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Sync To Yahoo Ads Segment',
  description: 'Sync Segment Audience to Yahoo Ads Segment',
  defaultSubscription: 'type = "identify" or type = "track"',
  fields: {
    segment_audience_id: {
      label: 'Segment Audience Id', // Maps to Yahoo Taxonomy Segment Id
      description: 'Segment Audience Id (aud_...). Maps to "Id" of a Segment node in Yahoo taxonomy',
      type: 'hidden',
      required: true,
      default: {
        '@path': '$.context.personas.computation_id'
      }
    },
    segment_audience_key: {
      label: 'Segment Audience Key',
      description: 'Segment Audience Key. Maps to the "Name" of the Segment node in Yahoo taxonomy',
      type: 'hidden',
      required: true,
      default: {
        '@path': '$.context.personas.computation_key'
      }
    },
    // Fetch event traits or props, which will be used to determine user's membership in an audience
    event_attributes: {
      label: 'Event traits or properties. Do not modify this setting',
      description: 'Event traits or properties. Do not modify this setting',
      type: 'object',
      readOnly: true,
      required: true,
      default: {
        '@if': {
          exists: { '@path': '$.properties' },
          then: { '@path': '$.properties' },
          else: { '@path': '$.traits' }
        }
      }
    },
    segment_computation_action: {
      label: 'Segment Computation Action',
      description:
        "Segment computation class used to determine if input event is from an Engage Audience'. Value must be = 'audience'.",
      type: 'hidden',
      required: true,
      default: {
        '@path': '$.context.personas.computation_class'
      },
      choices: [{ label: 'audience', value: 'audience' }]
    },
    enable_batching: {
      label: 'Enable Batching',
      description: 'Enable batching of requests',
      type: 'hidden', // We should always batch Yahoo requests
      default: true
    },
    batch_size: {
      label: 'Batch Size',
      description: 'Maximum number of events to include in each batch. Actual batch sizes may be lower.',
      type: 'number',
      unsafe_hidden: true,
      required: false,
      default: 1000
    },
    email: {
      label: 'User Email',
      description: 'Email address of a user',
      type: 'hidden',
      default: {
        '@if': {
          exists: { '@path': '$.context.traits.email' },
          then: { '@path': '$.context.traits.email' },
          else: { '@path': '$.traits.email' }
        }
      }
    },
    advertising_id: {
      label: 'User Mobile Advertising ID',
      description: "User's Mobile Advertising Id",
      type: 'hidden',
      default: {
        '@path': '$.context.device.advertisingId'
      },
      required: true
    },
    device_type: {
      label: 'User Mobile Device Type', // This field is required to determine the type of the advertising Id: IDFA or GAID
      description: "The user's mobile device type",
      type: 'hidden',
      default: {
        '@path': '$.context.device.type'
      },
      required: true
    },
    send_advertising_id: {
      label: 'Send Mobile Advertising ID',
      description: 'Send mobile advertising ID (IDFA or Google Ad Id) to Yahoo. Segment will hash MAIDs',
      type: 'boolean',
      required: true,
      default: true
    },
    send_email: {
      label: 'Send User Email',
      description: 'Send user email to Yahoo. Segment will hash emails',
      type: 'boolean',
      required: true,
      default: true
    },
    gdpr_flag: {
      label: 'GDPR Flag',
      description: 'Set to true to indicate that audience data is subject to GDPR regulations',
      type: 'boolean',
      required: true,
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

  perform: (request, { payload, auth }) => {
    if (auth?.accessToken) {
      const creds = Buffer.from(auth?.accessToken, 'base64').toString()
      const creds_json = JSON.parse(creds)
      const rt_access_token = creds_json.rt
      const body = gen_update_segment_payload([payload])
      return request('https://dataxonline.yahoo.com/online/audience/', {
        method: 'POST',
        json: body,
        headers: {
          Authorization: `Bearer ${rt_access_token}`
        }
      })
        .then((response) => response.json())
        .then((response) => console.log(response))
        .then((response) => {
          return response
        })
        .catch((err) => {
          console.log('perform: error updating segment >', err)
        })
    } else {
      console.log('updateSegment > perform: no auth access_token')
    }
  },
  performBatch: (request, { payload, auth }) => {
    if (auth?.accessToken) {
      const body = gen_update_segment_payload(payload)
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
        .then((response) => response.json())
        .then((response) => console.log(response))
        .then((response) => {
          return response
        })
        .catch((err) => {
          console.log('performBatch: error updating segment >', err)
        })
    } else {
      console.log('updateSegment > performBatch: no auth access_token')
    }
  }
}

export default action
