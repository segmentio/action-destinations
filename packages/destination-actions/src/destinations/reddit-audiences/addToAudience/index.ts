import type { ActionDefinition } from '@segment/actions-core'
import type { AudienceSettings, Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload, AudienceSettings> = {
  title: 'Add to Audience',
  description: 'Add users to a Reddit Custom Audience List.',
  fields: {
    audience_id: {
      type: 'string',
      required: true,
      label: 'Audience ID',
      description:
        'The Reddit Audience ID to add users to. You can find this in your Reddit Audience Manager page.'
    },
    email: {
      type: 'string',
      required: false,
      label: 'User Email',
      description:
        "The user's email address.",
      default: {
        '@if': {
          exists: { '@path': '$.context.traits.email' },
          then: { '@path': '$.context.traits.email' },
          else: { '@path': '$.properties.email' }
        }
      }
    },
    maid: {
      type: 'string',
      required: false,
      label: 'Mobile Advertising ID (IDFA, AAID)',
      description:
        "The user's mobile advertising ID (IDFA or AAID)",
      default: {
        '@path': '$.context.device.advertisingId'
      }
    },
    send_email: {
      type: 'boolean',
      label: 'Send Email',
      description:
        "Send emails to Reddit to add to the Custom Audience List.",
      default: true
    },
    send_maid: {
      type: 'boolean',
      label: 'Send Mobile Advertising ID',
      description:
        "Send Mobile Advertising IDs (IDFA / AAID) to Reddit to add to the Custom Audience List.",
      default: true
    },
    enable_batching: {
      type: 'boolean',
      label: 'Enable Batching',
      description:
        'Enable batching of requests.',
      required: true,
      default: true,
      unsafe_hidden: true
    }
  },
  perform: (request, data) => {
    // Make your partner api request here!
    // return request('https://example.com', {
    //   method: 'post',
    //   json: data.payload
    // })
  },
  performBatch: (request, data) => {
    // Make your partner api request here!
    // return request('https://example.com', {
    //   method: 'post',
    //   json: data.payload
    // })
  }
}

export default action
