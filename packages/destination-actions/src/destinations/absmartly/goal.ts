import { mapUnits, Units } from './unit'
import { InputField, ModifiedResponse, PayloadValidationError, RequestClient } from '@segment/actions-core'
import { sendEvent, PublishRequestEvent, defaultEventFields, DefaultPayload } from './event'
import { Settings } from './generated-types'
import { isValidTimestamp, unixTimestampOf } from './timestamp'
import { Data } from 'ws'

export interface PublishRequestGoal {
  name: string
  achievedAt: number
  properties: null | Record<string, unknown>
}

export interface GoalPayload extends Units, DefaultPayload {
  name: string
  achievedAt: string | number
  properties?: null | Record<string, unknown>
}

export const defaultGoalFields: Record<string, InputField> = {
  units: {
    label: 'Units',
    type: 'object',
    required: true,
    description:
      'The units of the goal to track. Mapping of unit name to source property in the event payload. Create Units in the Settings -> Units section of the ABsmartly Web Console',
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
  achievedAt: {
    label: 'Goal Achievement Time',
    type: 'datetime',
    required: true,
    description:
      'Exact timestamp when the goal was achieved (measured by the client clock). Must be an ISO 8601 date-time string, or a Unix timestamp (milliseconds) number',
    default: {
      '@path': '$.originalTimestamp'
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
  payload: GoalPayload,
  settings: Settings
): Promise<ModifiedResponse<Data>> {
  if (typeof payload.name !== 'string' || payload.name.length == 0) {
    throw new PayloadValidationError('Goal `name` is required to be a non-empty string')
  }

  if (!isValidTimestamp(payload.publishedAt)) {
    throw new PayloadValidationError(
      'Goal `publishedAt` is required to be an ISO 8601 date-time string, or a Unix timestamp (milliseconds) number'
    )
  }

  if (!isValidTimestamp(payload.achievedAt)) {
    throw new PayloadValidationError(
      'Goal `achievedAt` is required to be an ISO 8601 date-time string, or a Unix timestamp (milliseconds) number'
    )
  }

  if (payload.properties != null && typeof payload.properties != 'object') {
    throw new PayloadValidationError('Goal `properties` if present is required to be an object')
  }

  const event: PublishRequestEvent = {
    publishedAt: unixTimestampOf(payload.publishedAt),
    units: mapUnits(payload),
    goals: [
      {
        name: payload.name,
        achievedAt: unixTimestampOf(payload.achievedAt),
        properties: payload.properties ?? null
      }
    ]
  }

  return sendEvent(request, settings, event, payload.agent, payload.application)
}
