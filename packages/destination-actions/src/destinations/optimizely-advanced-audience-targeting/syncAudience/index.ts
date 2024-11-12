import { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { OptimizelyClient, Data } from './optimizely-client'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Sync Audience',
  description: 'Sync a Segment Engage Audience to Optimizely Data Platform',
  defaultSubscription: 'type = "track" or type = "identify"',
  fields: {
    custom_audience_name: {
      label: 'Custom Audience Name',
      description: 'Name of custom audience to add or remove the user from',
      type: 'string',
      unsafe_hidden: true,
      required: true,
      default: {
        '@path': '$.context.personas.computation_key'
      }
    },
    segment_computation_action: {
      label: 'Segment Computation Action',
      description: 'Segment computation class used to determine payload is for an Audience',
      type: 'string',
      unsafe_hidden: true,
      required: true,
      default: {
        '@path': '$.context.personas.computation_class'
      },
      choices: [{ label: 'Audience', value: 'audience' }]
    },
    segment_computation_id: {
      label: 'Segment Computation ID',
      description: 'Segment computation ID',
      type: 'string',
      unsafe_hidden: true,
      required: true,
      default: {
        '@path': '$.context.personas.computation_id'
      }
    },
    optimizelyUserId: {
      label: 'Optimizely User ID',
      description: 'The user identifier to sync to the Optimizely Audience',
      type: 'string',
      required: true,
      default: {
        '@if': {
          exists: { '@path': '$.userId' },
          then: { '@path': '$.userId' },
          else: { '@path': '$.anonymousId' }
        }
      }
    },
    timestamp: {
      label: 'Timestamp',
      type: 'string',
      unsafe_hidden: true,
      required: true,
      description: 'Timestamp indicates when the user was added or removed from the Audience',
      default: {
        '@path': '$.timestamp'
      }
    },
    enable_batching: {
      label: 'Enable Batching',
      description: 'Enable batching of event data to Optimizely.',
      type: 'boolean',
      default: true,
      unsafe_hidden: true
    },
    batch_size: {
      label: 'Batch Size',
      description: 'Number of events to batch before sending to Optimizely.',
      type: 'integer',
      default: 100,
      unsafe_hidden: true
    }
  },

  perform: async (request, data) => {
    const optimizelyClient = new OptimizelyClient(request, data as Data)
    await optimizelyClient.send()
  },
  performBatch: async (request, data) => {
    const optimizelyClient = new OptimizelyClient(request, data as Data)
    await optimizelyClient.send()
  }
}

export default action
