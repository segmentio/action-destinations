import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Update Audience',
  description: 'Sync contacts from an Engage Audience to a TikTok Audience Segment.',
  defaultSubscription: 'event = "Audience Entered" or event = "Audience Exited"',
  fields: {
    custom_audience_name: {
      label: 'Custom Audience Name',
      description:
        'Custom audience name of audience to be created. Please note that names over 70 characters will be truncated to 67 characters with "..." appended. This field is set only when Segment creates a new audience.Updating this field after Segment has created an audience will not update the audience name in TikTok.',
      type: 'string',
      default: {
        '@if': {
          exists: { '@path': '$.context.personas.computation_ID' },
          then: { '@path': '$.context.personas.computation_ID' },
          else: { '@path': '$.properties.audience_key' }
        }
      }
    },
    id_type: {
      label: 'ID Type',
      description: 'Encryption type to be used for populating the audience.',
      type: 'string',
      choices: [
        { label: 'Email', value: 'EMAIL_SHA256' },
        { label: 'Google Advertising ID', value: 'GAID_SHA256' }
      ]
    },
    email: {
      label: 'User Email',
      description: "The user's email address to send to LinkedIn.",
      type: 'hidden', // This field is hidden from customers because the desired value always appears at path '$.context.traits.email' in Personas events.
      default: {
        '@path': '$.context.traits.email'
      }
    },
    google_advertising_id: {
      label: 'User Google Advertising ID',
      description: "The user's Google Advertising ID to send to LinkedIn.",
      type: 'hidden', // This field is hidden from customers because the desired value always appears at path '$.context.device.advertisingId' in Personas events.
      default: {
        '@path': '$.context.device.advertisingId'
      }
    },
    event_name: {
      label: 'Event Name',
      description: 'The name of the current Segment event.',
      type: 'hidden', // This field is hidden from customers because the desired value always appears at path '$.event' in Personas events.
      default: {
        '@path': '$.event'
      }
    },
    enable_batching: {
      label: 'Enable Batching',
      description: 'Enable batching of requests to the TikTok Audiences.',
      type: 'boolean',
      default: true
    }
  },
  perform: (request, data) => {
    // Make your partner api request here!
    return request('https://example.com', {
      method: 'post',
      json: data.payload
    })
  }
}

export default action
