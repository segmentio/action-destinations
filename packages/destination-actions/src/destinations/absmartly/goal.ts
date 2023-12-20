import { mapUnits, Units } from './unit'
import { InputField, ModifiedResponse, PayloadValidationError, RequestClient } from '@segment/actions-core'
import { sendEvent, PublishRequestEvent, defaultEventFields, DefaultPayload } from './event'
import { Settings } from './generated-types'
import { unixTimestampOf } from './timestamp'
import { Data } from 'ws'

export interface PublishRequestGoal {
  name: string
  achievedAt: number
  properties: null | Record<string, unknown>
}

export interface GoalPayload extends Units, DefaultPayload {
  name: string
  properties?: null | Record<string, unknown>
}

export const defaultGoalFields: Record<string, InputField> = {
  units: {
    label: 'Units',
    type: 'object',
    required: true,
    description:
      'The units of the goal to track. Mapping of unit name to source property in the event payload. Create Units in the Settings > Units section of the ABsmartly Web Console',
    defaultObjectUI: 'keyvalue:only',
    default: {
      anonymousId: {
        '@path': '$.anonymousId'
      },
      userId: {
        '@path': '$.userId'
      }
    }
  },
  name: {
    label: 'Goal Name',
    type: 'string',
    required: true,
    description: 'The name of the goal to track',
    default: {
      '@path': '$.event'
    }
  },
  properties: {
    label: 'Goal Properties',
    type: 'object',
    required: true,
    description: 'Custom properties of the goal',
    default: {
      '@path': '$.properties'
    }
  },
  ...defaultEventFields
}

export function sendGoal(
  request: RequestClient,
  timestamp: number,
  payload: GoalPayload,
  settings: Settings
): Promise<ModifiedResponse<Data>> {
  if (typeof payload.name !== 'string' || payload.name.length == 0) {
    throw new PayloadValidationError('Goal `name` is required to be a non-empty string')
  }

  if (payload.properties != null && typeof payload.properties != 'object') {
    throw new PayloadValidationError('Goal `properties` if present is required to be an object')
  }

  const event: PublishRequestEvent = {
    historic: true,
    publishedAt: unixTimestampOf(timestamp),
    units: mapUnits(payload),
    goals: [
      {
        name: payload.name,
        achievedAt: unixTimestampOf(timestamp),
        properties: payload.properties ?? null
      }
    ]
  }

  return sendEvent(request, settings, event, payload.agent, payload.application)
}
