import { get } from './get'
import { Subscription, Condition, GroupCondition, Operator, ErrorCondition } from './types'

const validateGroupCondition = (
  condition: GroupCondition,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any
): boolean => {
  if (condition.operator === 'and') {
    return condition.children.every((childCondition) => {
      return validateCondition(childCondition, data)
    })
  }

  if (condition.operator === 'or') {
    return condition.children.some((childCondition) => {
      return validateCondition(childCondition, data)
    })
  }

  return false
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const validate = (condition: Subscription, data: any): boolean => {
  if ((condition as ErrorCondition).error || typeof data === 'undefined') {
    return false
  }

  return validateGroupCondition(condition as GroupCondition, data)
}

export default validate

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const validateCondition = (condition: Condition, data: any): boolean => {
  if (condition.type === 'event-type') {
    return validateValue(data.type, condition.operator, condition.value)
  }

  if (condition.type === 'event') {
    return validateValue(data.event, condition.operator, condition.value)
  }

  if (condition.type === 'name') {
    return validateValue(data.name, condition.operator, condition.value)
  }

  if (condition.type === 'userId') {
    return validateValue(data.userId, condition.operator, condition.value)
  }

  if (condition.type === 'event-property') {
    return validateValue(get(data.properties, condition.name), condition.operator, condition.value)
  }

  if (condition.type === 'event-trait') {
    return validateValue(get(data.traits, condition.name), condition.operator, condition.value)
  }

  if (condition.type === 'event-context') {
    return validateValue(get(data.context, condition.name), condition.operator, condition.value)
  }

  if (condition.type === 'group') {
    return validateGroupCondition(condition, data)
  }

  return false
}

const validateValue = (actual: unknown, operator: Operator, expected?: string | boolean | number): boolean => {
  switch (operator) {
    case '=':
      return actual === String(expected)
    case '!=':
      return actual !== String(expected)
    case '<':
      return typeof actual === 'number' && Number(actual) < Number(expected)
    case '<=':
      return typeof actual === 'number' && Number(actual) <= Number(expected)
    case '>':
      return typeof actual === 'number' && Number(actual) > Number(expected)
    case '>=':
      return typeof actual === 'number' && Number(actual) >= Number(expected)
    case 'contains':
      return typeof actual === 'string' && actual.includes(String(expected))
    case 'not_contains':
      return typeof actual === 'string' && !actual.includes(String(expected))
    case 'starts_with':
      return typeof actual === 'string' && actual.startsWith(String(expected))
    case 'not_starts_with':
      return typeof actual === 'string' && !actual.startsWith(String(expected))
    case 'ends_with':
      return typeof actual === 'string' && actual.endsWith(String(expected))
    case 'not_ends_with':
      return typeof actual === 'string' && !actual.endsWith(String(expected))
    case 'exists':
      return actual !== undefined && actual !== null
    case 'not_exists':
      return actual === undefined || actual === null
    case 'is_true':
      return typeof actual === 'boolean' && actual === true
    case 'is_false':
      return typeof actual === 'boolean' && actual === false
    default:
      return false
  }
}
