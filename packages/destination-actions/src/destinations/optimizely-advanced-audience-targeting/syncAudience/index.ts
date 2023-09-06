import { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { getHost } from '../utils'

interface Data {
  payload: Payload & {
    context?: {
      [k: string]: unknown
      personas?: {
        computation_key?: string
        computation_class?: string
      }
    }
  }
  rawData?: {
    context?: {
      personas?: {
        computation_key?: string
        computation_class?: string
      }
    }
    properties?: Record<string, boolean>
    traits?: Record<string, boolean>
  }
}

const action: ActionDefinition<Settings, Payload> = {
  title: 'Sync Audience',
  description: 'Sync a Segment Engage Audience to Optimizely Data Platform',
  defaultSubscription: 'type = "track" or type = "identify"',
  fields: {
    custom_audience_name: {
      label: 'Custom Audience Name',
      description: 'Name of custom audience to add or remove the user from',
      type: 'hidden',
      required: true,
      default: {
        '@path': '$.context.personas.computation_key'
      }
    },
    segment_computation_action: {
      label: 'Segment Computation Action',
      description: 'Segment computation class used to determine payload is for an Audience',
      type: 'hidden',
      required: true,
      default: {
        '@path': '$.context.personas.computation_class'
      },
      choices: [{ label: 'Audience', value: 'audience' }]
    },
    segment_computation_id: {
      label: 'Segment Computation ID',
      description: 'Segment computation ID',
      type: 'hidden',
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
      type: 'hidden',
      required: true,
      description: 'Timestamp indicates when the user was added or removed from the Audience',
      default: {
        '@path': '$.timestamp'
      }
    }
  },

  perform: async (request, data) => {
    const payload = data.payload
    const settings = data.settings

    const host = getHost(settings)

    const d: Data = data
    const audienceId = payload.segment_computation_id
    const audienceName = payload.custom_audience_name
    const audienceValue = d?.rawData?.properties?.[audienceName] ?? d?.rawData?.traits?.[audienceName]

    return request(`${host}/event_import`, {
      method: 'post',
      json: {
        audienceId: audienceId,
        audienceName: audienceName,
        timestamp: payload.timestamp,
        subscription: audienceValue,
        userId: payload.optimizelyUserId
      }
    })
  }
}

export default action
