import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { IntegrationError } from '@segment/actions-core/'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Sync Audience',
  description: 'Sync a Segment Engage Audience to Taboola.',
  fields: {
    segment_audience_id: {
      label: 'Audience ID',
      description: 'Segment Audience ID to which user identifier should be added or removed',
      type: 'string',
      unsafe_hidden: true,
      required: true,
      default: {
        '@path': '$.context.personas.computation_id'
      }
    },
    segment_computation_key: {
      label: 'Audience Key',
      description: 'Segment Audience key to which user identifier should be added or removed',
      type: 'string',
      unsafe_hidden: true,
      required: true,
      default: {
        '@path': '$.context.personas.computation_key'
      }
    },
    segment_computation_action: {
      label: 'Segment Computation Action',
      description:
        "Segment computation class used to determine if input event is from an Engage Audience'. Value must be = 'audience'.",
      type: 'string',
      unsafe_hidden: true,
      required: true,
      default: {
        '@path': '$.context.personas.computation_class'
      },
      choices: [{ label: 'audience', value: 'audience' }]
    },
    user_email: {
      label: 'Email address',
      description: "The user's email address",
      type: 'string',
      unsafe_hidden: true,
      required: false,
      default: {
        '@if': {
          exists: { '@path': '$.traits.email' },
          then: { '@path': '$.traits.email' },
          else: { '@path': '$.context.traits.email' }
        }
      }
    },
    traits_or_props: {
      label: 'Traits or properties object',
      description: 'A computed object for track and identify events. This field should not need to be edited.',
      type: 'object',
      required: true,
      unsafe_hidden: true,
      default: {
        '@if': {
          exists: { '@path': '$.properties' },
          then: { '@path': '$.properties' },
          else: { '@path': '$.traits' }
        }
      }
    },
    enable_batching: {
      type: 'boolean',
      label: 'Batch events',
      description:
        'When enabled, the action will batch events before sending them to LaunchDarkly. In most cases, batching should be enabled.',
      required: false,
      default: true
    },
    advertisingId: {
      label: 'Advertising ID',
      description: "Advertising ID.",
      type: 'string',
      required: false,
      unsafe_hidden: true, 
      default: {
        '@path': '$.context.device.advertisingId'
      }
    },
    batch_size: {
      label: 'Batch Size',
      description: 'Max Batch size to send to Taboola.',
      type: 'integer',
      default: 300,
      required: true,
      unsafe_hidden: true
    }
  },
  perform: (request, {payload, audienceFields, auth, settings}) => {
    
    if(!payload.user_email && !payload.advertisingId) {
      throw new IntegrationError('Either user_email or advertisingId must be provided in the payload')
    }
   
    const action = payload.traits_or_props[payload.segment_computation_key] as boolean
    
    const audienceName = audienceFields.audienceName

    const email = payload.user_email

    const advertisingId = payload.advertisingId
    
    const access_token = auth?.accessToken

    const client_id = settings.client_id

    const client_secret = settings.client_secret

    const accountId = audienceFields.accountId

    return request('https://example.com', {
      method: 'post',
      json: data.payload,
       headers: {
         'Content-Type': 'application,
         'Authorization': `Bearer ${access_token}`
       }
    })
  }
}

export default action
