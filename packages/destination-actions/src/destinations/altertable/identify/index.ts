import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { getNestedValue, parseContext } from '../utils'

type IdentifyRequestPayload = {
  environment: string
  traits: Record<string | `$${string}`, unknown>
  timestamp: string | number
  distinct_id: string | null | undefined
  anonymous_id: string | null | undefined
  device_id: string | null | undefined
}

const action: ActionDefinition<Settings, Payload> = {
  title: 'Identify',
  description: 'Identify a user in Altertable.',
  fields: {
    userId: {
      label: 'User ID',
      description: 'The ID of the user',
      type: 'string',
      default: {
        '@path': '$.userId'
      },
      required: true
    },
    anonymousId: {
      label: 'Anonymous ID',
      description: 'The anonymous ID of the user',
      type: 'string',
      default: {
        '@path': '$.anonymousId'
      },
      required: false
    },
    context: {
      label: 'Context',
      description: 'The context properties to send with the identify',
      type: 'object',
      default: {
        '@path': '$.context'
      },
      required: false
    },
    traits: {
      label: 'Traits',
      description: 'The traits of the user',
      type: 'object',
      default: {
        '@path': '$.traits'
      },
      required: true
    },
    timestamp: {
      label: 'Timestamp',
      description: 'The timestamp of the identification',
      type: 'datetime',
      default: {
        '@path': '$.timestamp'
      },
      required: true
    }
  },
  perform: (request, { payload, settings }) => {
    const distinctId = payload.userId || payload.anonymousId
    const anonymousId = payload.userId && payload.userId !== payload.anonymousId ? payload.anonymousId : undefined

    const body: IdentifyRequestPayload = {
      environment: settings.environment,
      traits: {
        ...parseContext(payload.context),
        ...payload.traits
      },
      timestamp: payload.timestamp,
      distinct_id: distinctId,
      anonymous_id: anonymousId,
      device_id: getNestedValue(payload.context, 'device.id')
    }

    return request(`${settings.endpoint}/identify`, {
      method: 'post',
      json: body
    })
  }
}

export default action
