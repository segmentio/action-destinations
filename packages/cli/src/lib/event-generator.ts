import { Condition, GroupConditionOperator, Operator } from '@segment/destination-subscriptions'
import { set } from 'lodash'

type SegmentEvent = Record<string, any>

function isGroupConditionOperator(op: any): op is GroupConditionOperator {
  return ['and', 'or'].includes(op)
}

function handleOperator(operator: Operator, value: unknown): unknown {
  switch (operator) {
    case '=':
      return value
    case '!=':
      if (value === null || value === undefined) {
        return `not ${value}`
      } else if (typeof value === 'string') {
        return `not ${value}`
      } else if (typeof value === 'number') {
        return value + 1
      } else if (typeof value === 'boolean') {
        return !value
      } else {
        return `not ${value}`
      }
    case '<':
      if (typeof value === 'number') {
        return value - 1
      } else {
        return value
      }
    case '>':
      if (typeof value === 'number') {
        return value + 1
      } else {
        return value
      }
    case '<=':
    case '>=':
      return value
    case 'contains':
    case 'ends_with':
    case 'starts_with':
      return value
    case 'not_contains':
      if (typeof value === 'string') {
        return `not contains ...`
      } else {
        return value
      }
    case 'not_starts_with':
      if (typeof value === 'string') {
        return `not starts with ${value}`
      } else {
        return value
      }
    case 'not_ends_with':
      if (typeof value === 'string') {
        return `${value} ...`
      } else {
        return value
      }
    case 'exists':
      return 'value'
    case 'not_exists':
      return undefined
    case 'is_true':
      return true
    case 'is_false':
      return false
    default:
      throw new Error(`Unsupported operator: ${operator}`)
  }
}

export function reconstructSegmentEvent(conditions: Condition[], baseEvent: SegmentEvent): SegmentEvent {
  const event = { ...baseEvent }

  conditions.forEach((condition) => {
    if (isGroupConditionOperator(condition.operator)) {
      return
    }

    const value = handleOperator(condition.operator, (condition as any).value)
    if (value === undefined) return

    switch (condition.type) {
      case 'event-type':
        event.type = value as string
        break
      case 'event':
        event.event = value as string
        event.type = 'track' // event usually comes with track events
        break
      case 'name':
        event.name = value as string
        event.type = event.type ?? 'page' // name usually comes with page events
        break
      case 'userId':
        event.userId = value as string
        break
      case 'event-property':
        if (!event.properties) {
          event.properties = {}
        }

        if (condition.name) {
          set(event?.properties, condition.name, value)
        }
        event.type = event.type ?? 'track' // properties usually come with track events
        break
      case 'event-trait':
        if (!event.traits) {
          event.traits = {}
        }

        if (condition.name) {
          set(event?.traits, condition.name, value)
        }
        event.type = event.type ?? 'identify' // traits usually come with identify events
        break
      case 'event-context':
        if (condition.name) {
          set(event.context, condition.name, value)
        }
        break
      default:
        break
    }
  })

  const getEventWithoutExtraKey = (): SegmentEvent => {
    if (event.type === 'track') {
      const { traits, ...eventWithoutTraits } = event

      return eventWithoutTraits
    }

    if (event.type === 'identify') {
      const { properties, ...eventWithoutProperties } = event

      return eventWithoutProperties
    }

    return event
  }

  return getEventWithoutExtraKey()
}
