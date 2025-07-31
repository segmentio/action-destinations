import type { InputField, Condition } from './types'

/**
 * Helper function to evaluate a single depends_on condition
 */
function evaluateCondition(condition: Condition, payload: Record<string, any>): boolean {
  if (condition.type === 'syncMode') {
    // Handle syncMode conditions if needed in the future
    return true
  }

  // Handle field conditions
  const fieldCondition = condition as any // Cast to handle the union type
  const fieldValue = payload[fieldCondition.fieldKey]

  switch (fieldCondition.operator) {
    case 'is':
      return Array.isArray(fieldCondition.value)
        ? fieldCondition.value.includes(fieldValue)
        : fieldValue === fieldCondition.value
    case 'is_not':
      return Array.isArray(fieldCondition.value)
        ? !fieldCondition.value.includes(fieldValue)
        : fieldValue !== fieldCondition.value
    default:
      return true
  }
}

/**
 * Helper function to evaluate depends_on conditions for a field
 */
function shouldIncludeField(payload: Record<string, any>, fieldDefinition: InputField): boolean {
  if (!fieldDefinition.depends_on) {
    return true // No conditions, always include
  }

  const { conditions, match = 'all' } = fieldDefinition.depends_on

  const results = conditions.map((condition: Condition) => evaluateCondition(condition, payload))

  return match === 'all' ? results.every(Boolean) : results.some(Boolean)
}

/**
 * Filter payload based on depends_on conditions defined in action fields
 *
 * This function removes fields from the payload that don't meet their depends_on conditions,
 * ensuring that fields which are conditionally hidden in the UI are also excluded from
 * the actual API request.
 *
 * @param payload - The payload object to filter
 * @param fields - The field definitions from the action that contain depends_on conditions
 * @returns A new payload object with fields filtered based on depends_on conditions
 *
 * @example
 * ```typescript
 * const filteredPayload = filterPayloadByDependsOn(payload, action.fields)
 * ```
 */
export function filterPayloadByDependsOn<T extends Record<string, any>>(
  payload: T,
  fields: Record<string, InputField>
): T {
  const filteredPayload = { ...payload }

  // Check each field to see if it should be included based on depends_on conditions
  Object.keys(fields).forEach((fieldName) => {
    const fieldDefinition = fields[fieldName]

    if (!shouldIncludeField(payload, fieldDefinition)) {
      delete (filteredPayload as any)[fieldName]
    }
  })

  return filteredPayload
}

/**
 * Alternative function that takes an action definition and filters the payload
 *
 * @param payload - The payload object to filter
 * @param actionDefinition - The action definition containing the fields
 * @returns A new payload object with fields filtered based on depends_on conditions
 */
export function filterPayloadByActionDefinition<T extends Record<string, any>>(
  payload: T,
  actionDefinition: { fields: Record<string, InputField> }
): T {
  return filterPayloadByDependsOn(payload, actionDefinition.fields)
}
