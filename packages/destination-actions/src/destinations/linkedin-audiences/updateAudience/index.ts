import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Update Audience',
  description: '',
  fields: {
    dmp_segment_name: {
      label: 'DMP Segment Name',
      description: 'The name of the LinkedIn DMP Segment to send data to.',
      type: 'string',
      required: true,
      default: {
        '@path': '$.properties.audience_key'
      }
    },
    enable_batching: {
      label: 'Enable Batching',
      description: 'Enable batching of requests to the DMP Segment.',
      type: 'boolean',
      default: true
    },
    send_email_address: {
      label: 'Send Email Address',
      description: "Whether to send a SHA-256 hash of users' email address to LinkedIn.",
      type: 'boolean',
      default: true
    },
    send_google_advertising_id: {
      label: 'Send Google Advertising ID',
      description:
        "Whether to send each user's Google Advertising ID (GAID) to LinkedIn. GAID is sometimes referred to as Android Advertising ID.",
      type: 'boolean',
      default: true
    }
  },
  perform: (request, data) => {
    return { request, data }
  }
}

export default action
