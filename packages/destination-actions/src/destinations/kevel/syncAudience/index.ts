import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

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
  description: 'Sync a Segment Engage Audience to a Kevel Segment',
  defaultSubscription: 'type = "identify" or type = "track"',
  fields: {
    segment_computation_key: {
      label: 'Audience Key',
      description: 'Segment Audience name to which user identifier should be added or removed',
      type: 'hidden',
      required: true,
      default: {
        '@path': '$.context.personas.computation_key'
      }
    },
    segment_computation_id: {
      label: 'Audience ID',
      description: 'Segment Audience ID to which user identifier should be added or removed',
      type: 'hidden',
      required: true,
      default: {
        '@path': '$.context.personas.computation_id'
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
    segment_user_id: {
      label: 'User ID',
      description: "The user's unique ID",
      type: 'hidden',
      required: true,
      default: { '@path': '$.userId' }
    }
  },
  perform: async (request, data) => {
    const payload = data.payload
    const settings = data.settings

    const d: Data = data

    const segmentComputationKey = payload.segment_computation_key
    const audienceValue = d?.rawData?.properties?.[segmentComputationKey] ?? d?.rawData?.traits?.[segmentComputationKey]

    return request(settings.kevelURL, {
      method: 'post',
      json: {
       user: {
        id: payload.segment_user_id,
        type: settings.userIdType
       },
       audience: {
        id: payload.segment_computation_id,
        name: payload.segment_computation_key,
        value: audienceValue
       }
      }
    })

  }
}

export default action
