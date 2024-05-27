import type { ActionDefinition } from '@segment/actions-core'
import type { Settings, AudienceSettings } from '../generated-types'
import type { Payload } from './generated-types'
import { IntegrationError } from '@segment/actions-core/'

const action: ActionDefinition<Settings, Payload, AudienceSettings> = {
  title: 'Sync Audience',
  description: 'Sync a Segment Engage Audience to Taboola.',
  fields: {
    external_audience_id: {
      label: 'External Audience ID',
      description: "The Audience ID from Taboola.",
      type: 'string',
      required: true,
      unsafe_hidden: true,
      default: {
        '@path': '$.context.personas.external_audience_id'
      }
    },
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
      required: true,
      default: true
    },
    device_id: {
      label: 'Mobile Device ID',
      description: 'Mobile Device ID.',
      type: 'string',
      required: false,
      unsafe_hidden: true,
      default: {
        '@path': '$.context.device.id'
      }
    },
    batch_size: {
      label: 'Batch Size',
      description: 'Max Batch size to send to Taboola.',
      type: 'integer',
      default: 300, // TODO EDEN TO CHECK MAX BATCH SIZE
      required: true,
      unsafe_hidden: true
    }
  },
  perform: (request, { payload, audienceSettings }) => {
    if (!payload.user_email && !payload.device_id) {
      throw new IntegrationError(
        "Either 'Email address' or 'Mobile Device ID' must be provided in the payload",
        'MISSING_REQUIRED_FIELD',
        400
      )
    }

    if (!audienceSettings) {
      throw new IntegrationError('Bad Request: no audienceSettings found.', 'INVALID_REQUEST_DATA', 400)
    }

    const action = payload.traits_or_props[payload.segment_computation_key] as boolean

    const email = payload.user_email // TODO EDEN: hash the email?

    const cluster = []
    if (email) {
      cluster.push({
        user_id: email,
        type: 'EMAIL_ID',
        is_hashed: true
      })
    }

    if (payload.device_id) {
      cluster.push({
        user_id: payload.device_id,
        type: 'DEVICE_ID',
        is_hashed: false
      })
    }

    const requestBody = {
      operation: action ? 'ADD' : 'REMOVE',
      audience_id: payload.external_audience_id,
      identities: [
        {
          cluster: cluster
        }
      ]
    }

    return request(`https://backstage.taboola.com/backstage/api/1.0/${audienceSettings.account_id}/audience_onboarding`, {
      method: 'post',
      json: requestBody
    })
  },

  // TODO EDEN
  // performBatch: (request, { payload: payloads, audienceSettings }) => {
  
  // }
}

export default action
