import {
  Subscription,
  GroupCondition,
  EventTypeCondition,
  EventCondition,
  EventPropertyCondition,
  EventTraitCondition,
  EventContextCondition,
  EventUserIdCondition,
  EventNameCondition,
  Operator,
  ErrorCondition
} from './types'

const stringifyValue = (value: string | boolean | number | undefined): string => {
  if (typeof value === 'boolean' || typeof value === 'number') {
    return String(value)
  }

  return `"${value}"`
}

const fqlExpression = (name: string, operator: Operator, value: string | boolean | number | undefined): string => {
  switch (operator) {
    case 'contains':
      return `contains(${name}, ${stringifyValue(value)})`
    case 'not_contains':
      return `!contains(${name}, ${stringifyValue(value)})`
    case 'exists':
      return `${name} != null`
    case 'not_exists':
      return `${name} = null`
    case 'is_true':
      return `${name} = true`
    case 'is_false':
      return `${name} = false`
    case 'starts_with':
      return `match(${name}, "${String(value)}*")`
    case 'not_starts_with':
      return `!match(${name}, "${String(value)}*")`
    case 'ends_with':
      return `match(${name}, "*${String(value)}")`
    case 'not_ends_with':
      return `!match(${name}, "*${String(value)}")`
    case '<':
    case '>':
    case '<=':
    case '>=':
      return `${name} ${operator} ${Number(value)}`
    default:
      return `${name} ${operator} ${stringifyValue(value)}`
  }
}

const stringifyGroupNode = (node: GroupCondition): string => {
  return node.children
    .map((childNode) => {
      if (childNode.type === 'group') {
        return `(${stringifyGroupNode(childNode)})`
      }

      return stringifyChildNode(childNode)
    })
    .join(` ${node.operator} `)
}

/**
 * https://segment.com/docs/api/public-api/fql/#escaping-field-paths
 * If a character in a field path is not alphanumeric, underscore, or dash, it
 * must be escaped with a backslash.
 * We also do not escape periods because we cannot yet distinguish if they
 * are literal periods - we assume they are meant to delineate the path.
 *
 * FQL correctly translates : properties.product\ 1.price -> properties['product 1'].price
 */
const escapeFieldPathWithBackslash = (value: string) => {
  if (typeof value === 'string') {
    return value.replace(/[^a-zA-Z0-9._-]/g, '\\$&')
  }
  return value
}

const stringifyChildNode = (
  node:
    | EventTypeCondition
    | EventCondition
    | EventPropertyCondition
    | EventTraitCondition
    | EventContextCondition
    | EventUserIdCondition
    | EventNameCondition
): string => {
  let result = ''

  switch (node.type) {
    case 'name':
    case 'userId':
    case 'event': {
      result += fqlExpression(node.type, node.operator, node.value)
      break
    }

    case 'event-type': {
      result += fqlExpression('type', node.operator, node.value)
      break
    }

    case 'event-property': {
      const escapedName = escapeFieldPathWithBackslash(node.name)
      result += fqlExpression(`properties.${escapedName}`, node.operator, node.value)
      break
    }

    case 'event-trait': {
      const escapedName = escapeFieldPathWithBackslash(node.name)
      result += fqlExpression(`traits.${escapedName}`, node.operator, node.value)
      break
    }

    case 'event-context': {
      const escapedName = escapeFieldPathWithBackslash(node.name)
      result += fqlExpression(`context.${escapedName}`, node.operator, node.value)
      break
    }

    default:
      throw new Error('Unknown condition type')
  }

  return result
}

const numberOfParens = (string: string): number => {
  let parens = 0

  for (const char of string.split('')) {
    if (char === '(' || char === ')') {
      parens++
    }
  }

  return parens
}

const generateFql = (ast: Subscription): string => {
  if ((ast as ErrorCondition).error) {
    throw (ast as ErrorCondition).error
  }

  const fql = stringifyGroupNode(ast as GroupCondition)

  if (fql.startsWith('(') && fql.endsWith(')') && numberOfParens(fql) === 2) {
    return fql.slice(1, -1)
  }

  return fql
}

export default generateFql
