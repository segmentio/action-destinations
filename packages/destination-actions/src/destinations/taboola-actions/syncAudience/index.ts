import type { ActionDefinition } from '@segment/actions-core'
import type { Settings, AudienceSettings } from '../generated-types'
import type { Payload } from './generated-types'
import { IntegrationError } from '@segment/actions-core'
import { TaboolaClient } from './client'

const action: ActionDefinition<Settings, Payload, AudienceSettings> = {
  title: 'Sync Audience',
  description: 'Sync a Segment Engage Audience to Taboola.',
  fields: {
    external_audience_id: {
      label: 'External Audience ID',
      description: 'The Audience ID from Taboola.',
      type: 'string',
      required: true,
      unsafe_hidden: true,
      default: {
        '@path': '$.context.personas.external_audience_id'
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
        'When enabled, events will be batched before being sent to Taboola. In most cases, batching should be enabled.',
      required: true,
      default: true
    },
    device_id: {
      label: 'Mobile Device ID',
      description:
        "To send iOS and Android Device IDs, include the 'ios.id' and 'android.id' Identifiers from the 'Customized Setup' option when connecting your Audience.",
      type: 'string',
      required: false,
      unsafe_hidden: false,
      default: {
        '@if': {
          exists: { '@path': '$.properties.ios.id' },
          then: { '@path': '$.properties.ios.id' },
          else: { '@path': '$.properties.android.id' }
        }
      }
    },
    batch_size: {
      label: 'Batch Size',
      description: 'Max Batch size to send to Taboola.',
      type: 'integer',
      default: 1000,
      required: true,
      unsafe_hidden: true
    },
    action: {
      label: 'Action',
      description: 'Action to perform on the audience.',
      type: 'string',
      required: false,
      unsafe_hidden: true,
      choices: [
        { label: 'Add', value: 'ADD' },
        { label: 'Remove', value: 'REMOVE' }
      ]
    }
  },
  perform: (request, { payload, audienceSettings }) => {
    if (!payload.external_audience_id) {
      throw new IntegrationError('Bad Request: payload.external_audience_id missing.', 'INVALID_REQUEST_DATA', 400)
    }

    if (!payload.user_email && !payload.device_id) {
      throw new IntegrationError(
        "Bad Request: Either 'Email address' or 'Mobile Device ID' must be provided in the payload.",
        'INVALID_REQUEST_DATA',
        400
      )
    }

    const taboolaClient = new TaboolaClient(request, [payload], audienceSettings)
    return taboolaClient.sendToTaboola()
  },
  performBatch: (request, { payload: payloads, audienceSettings }) => {
    const taboolaClient = new TaboolaClient(request, payloads, audienceSettings)
    return taboolaClient.sendToTaboola()
  }
}

export default action
