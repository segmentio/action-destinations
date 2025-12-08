/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * EventValidator - Client-side validation of tracking events against the Avo Tracking Plan.
 *
 * This module validates property values against constraints:
 * - Pinned values (exact match required)
 * - Allowed values (must be in list)
 * - Regex patterns (must match pattern)
 * - Min/max ranges (numeric values must be in range)
 *
 * No schema validation (types/required) is performed - only value constraints.
 * Validation runs against ALL events/variants in the response.
 */

import type {
  EventSpecResponse,
  EventSpecEntry,
  PropertyConstraints,
  PropertyValidationResult,
  ValidationResult
} from './EventFetcherTypes'

// =============================================================================
// HELPER FUNCTIONS FOR NESTED PROPERTIES
// =============================================================================

/**
 * Deep copies a constraint mapping (pinnedValues, allowedValues, etc.),
 * including the arrays inside to avoid shared references.
 */
function deepCopyConstraintMapping(mapping: Record<string, string[]>): Record<string, string[]> {
  const result: Record<string, string[]> = {}
  for (const [key, arr] of Object.entries(mapping)) {
    result[key] = [...arr]
  }
  return result
}

/**
 * Deep copies children constraints recursively.
 */
function deepCopyChildren(children: Record<string, PropertyConstraints>): Record<string, PropertyConstraints> {
  const result: Record<string, PropertyConstraints> = {}
  for (const [propName, constraintsUnknown] of Object.entries(children)) {
    const constraints = constraintsUnknown
    result[propName] = {
      type: constraints.type,
      required: constraints.required,
      pinnedValues: constraints.pinnedValues ? deepCopyConstraintMapping(constraints.pinnedValues) : undefined,
      allowedValues: constraints.allowedValues ? deepCopyConstraintMapping(constraints.allowedValues) : undefined,
      regexPatterns: constraints.regexPatterns ? deepCopyConstraintMapping(constraints.regexPatterns) : undefined,
      minMaxRanges: constraints.minMaxRanges ? deepCopyConstraintMapping(constraints.minMaxRanges) : undefined,
      children: constraints.children ? deepCopyChildren(constraints.children) : undefined
    }
  }
  return result
}

/**
 * Merges children constraints from source into target recursively.
 */
function mergeChildren(target: Record<string, PropertyConstraints>, source: Record<string, PropertyConstraints>): void {
  for (const [propName, sourceConstraintsUnknown] of Object.entries(source)) {
    const sourceConstraints = sourceConstraintsUnknown
    if (!target[propName]) {
      // New child property - deep copy it
      target[propName] = {
        type: sourceConstraints.type,
        required: sourceConstraints.required,
        pinnedValues: sourceConstraints.pinnedValues
          ? deepCopyConstraintMapping(sourceConstraints.pinnedValues)
          : undefined,
        allowedValues: sourceConstraints.allowedValues
          ? deepCopyConstraintMapping(sourceConstraints.allowedValues)
          : undefined,
        regexPatterns: sourceConstraints.regexPatterns
          ? deepCopyConstraintMapping(sourceConstraints.regexPatterns)
          : undefined,
        minMaxRanges: sourceConstraints.minMaxRanges
          ? deepCopyConstraintMapping(sourceConstraints.minMaxRanges)
          : undefined,
        children: sourceConstraints.children ? deepCopyChildren(sourceConstraints.children) : undefined
      }
    } else {
      // Merge into existing child property
      const targetConstraints = target[propName]
      mergeConstraintMappings(targetConstraints, sourceConstraints)
      // Recursively merge nested children
      if (sourceConstraints.children) {
        if (!targetConstraints.children) {
          targetConstraints.children = deepCopyChildren(sourceConstraints.children)
        } else {
          mergeChildren(targetConstraints.children, sourceConstraints.children)
        }
      }
    }
  }
}

/**
 * Merges constraint mappings (pinnedValues, allowedValues, etc.) from source into target.
 */
function mergeConstraintMappings(target: PropertyConstraints, source: PropertyConstraints): void {
  if (source.pinnedValues) {
    if (!target.pinnedValues) {
      target.pinnedValues = {}
    }
    for (const key of Object.keys(source.pinnedValues)) {
      if (target.pinnedValues[key]) {
        const merged = new Set(target.pinnedValues[key])
        for (const id of source.pinnedValues[key]) {
          merged.add(id)
        }
        target.pinnedValues[key] = Array.from(merged)
      } else {
        target.pinnedValues[key] = [...source.pinnedValues[key]]
      }
    }
  }
  if (source.allowedValues) {
    if (!target.allowedValues) {
      target.allowedValues = {}
    }
    for (const key of Object.keys(source.allowedValues)) {
      if (target.allowedValues[key]) {
        const merged = new Set(target.allowedValues[key])
        for (const id of source.allowedValues[key]) {
          merged.add(id)
        }
        target.allowedValues[key] = Array.from(merged)
      } else {
        target.allowedValues[key] = [...source.allowedValues[key]]
      }
    }
  }
  if (source.regexPatterns) {
    if (!target.regexPatterns) {
      target.regexPatterns = {}
    }
    for (const key of Object.keys(source.regexPatterns)) {
      if (target.regexPatterns[key]) {
        const merged = new Set(target.regexPatterns[key])
        for (const id of source.regexPatterns[key]) {
          merged.add(id)
        }
        target.regexPatterns[key] = Array.from(merged)
      } else {
        target.regexPatterns[key] = [...source.regexPatterns[key]]
      }
    }
  }
  if (source.minMaxRanges) {
    if (!target.minMaxRanges) {
      target.minMaxRanges = {}
    }
    for (const key of Object.keys(source.minMaxRanges)) {
      if (target.minMaxRanges[key]) {
        const merged = new Set(target.minMaxRanges[key])
        for (const id of source.minMaxRanges[key]) {
          merged.add(id)
        }
        target.minMaxRanges[key] = Array.from(merged)
      } else {
        target.minMaxRanges[key] = [...source.minMaxRanges[key]]
      }
    }
  }
}

// =============================================================================
// TYPES
// =============================================================================

/**
 * Runtime property value - can be any JSON-compatible type
 */
export type RuntimePropertyValue = string | number | boolean | null | undefined | object | Array<any>

/**
 * Runtime properties map
 */
export type RuntimeProperties = Record<string, RuntimePropertyValue>

// =============================================================================
// CACHES
// =============================================================================

/**
 * Cache for compiled regex objects to avoid recompilation on every event.
 * Patterns are expected to be stable per session.
 */
const regexCache = new Map<string, RegExp>()

/**
 * Gets a compiled regex from cache or compiles and caches it.
 * @throws Error if pattern is invalid
 */
function getOrCompileRegex(pattern: string): RegExp {
  let regex = regexCache.get(pattern)
  if (!regex) {
    // SECURITY: We trust regex patterns from the Avo backend (EventSpecResponse).
    // While a malicious pattern could cause ReDoS, we assume the backend is secure
    // and only delivers valid, non-malicious regexes derived from the Tracking Plan.
    // A complete fix would require a safe-regex validator or timeout-based execution.
    regex = new RegExp(pattern)
    regexCache.set(pattern, regex)
  }
  return regex
}

// =============================================================================
// MAIN VALIDATION FUNCTION
// =============================================================================

/**
 * Validates runtime properties against all events in the EventSpecResponse.
 *
 * For each property:
 * - If property not in spec: no validation needed (empty result)
 * - If property in spec: check constraints and collect failed/passed eventIds
 * - Return whichever list is smaller for bandwidth optimization
 *
 * @param properties - The properties observed at runtime
 * @param specResponse - The EventSpecResponse from the backend
 * @returns ValidationResult with baseEventId, metadata, and per-property results
 */
export function validateEvent(properties: RuntimeProperties, specResponse: EventSpecResponse): ValidationResult {
  // Collect all eventIds from all events
  const allEventIds = collectAllEventIds(specResponse.events)

  // Build lookup table: propertyName -> constraints (with embedded eventId mappings)
  const constraintsByProperty = collectConstraintsByPropertyName(specResponse.events)

  // Validate each runtime property against its constraints
  const propertyResults: Record<string, PropertyValidationResult> = {}

  for (const propName of Object.keys(properties)) {
    const value = properties[propName]
    const constraints = constraintsByProperty[propName]

    if (!constraints) {
      // Property not in spec - no constraints to fail
      propertyResults[propName] = {}
    } else {
      const result = validatePropertyConstraints(value, constraints, allEventIds)
      propertyResults[propName] = result
    }
  }

  return {
    metadata: specResponse.metadata,
    propertyResults
  }
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Collects all eventIds (baseEventId + variantIds) from all events.
 */
function collectAllEventIds(events: EventSpecEntry[]): string[] {
  const ids: string[] = []
  for (const event of events) {
    ids.push(event.baseEventId)
    for (let j = 0; j < event.variantIds.length; j++) {
      ids.push(event.variantIds[j])
    }
  }
  return ids
}

/**
 * Collects all property constraints from all events into a single lookup table.
 *
 * This is purely for lookup efficiency - each constraint already contains
 * its applicable eventIds, so no conflict resolution is needed.
 *
 * Example:
 *   Event1.props.method = { pinnedValues: { "email": ["evt_1"] } }
 *   Event2.props.method = { pinnedValues: { "phone": ["evt_2"] } }
 *
 *   Result: { method: { pinnedValues: { "email": ["evt_1"], "phone": ["evt_2"] } } }
 */
function collectConstraintsByPropertyName(events: EventSpecEntry[]): Record<string, PropertyConstraints> {
  // Fast path: no events
  if (events.length === 0) {
    return {}
  }

  // Fast path: single event, return props directly (no aggregation needed)
  if (events.length === 1) {
    return events[0].props
  }

  // Multiple events: aggregate constraints from all events
  const result: Record<string, PropertyConstraints> = {}

  for (const event of events) {
    for (const [propName, constraintsUnknown] of Object.entries(event.props)) {
      const constraints = constraintsUnknown
      if (!result[propName]) {
        // First time seeing this property - initialize with copies
        result[propName] = {
          type: constraints.type,
          required: constraints.required,
          pinnedValues: constraints.pinnedValues ? { ...constraints.pinnedValues } : undefined,
          allowedValues: constraints.allowedValues ? { ...constraints.allowedValues } : undefined,
          regexPatterns: constraints.regexPatterns ? { ...constraints.regexPatterns } : undefined,
          minMaxRanges: constraints.minMaxRanges ? { ...constraints.minMaxRanges } : undefined,
          children: constraints.children ? deepCopyChildren(constraints.children) : undefined
        }
      } else {
        // Aggregate constraint mappings from additional events
        const existing = result[propName]
        mergeConstraintMappings(existing, constraints)
        // Recursively merge nested children
        if (constraints.children) {
          if (!existing.children) {
            existing.children = deepCopyChildren(constraints.children)
          } else {
            mergeChildren(existing.children, constraints.children)
          }
        }
      }
    }
  }

  return result
}

/** Maximum nesting depth for recursive validation to prevent stack overflow */
const MAX_VALIDATION_DEPTH = 100

/**
 * Validates a property value against its constraints.
 * Returns the validation result with either failedEventIds or passedEventIds
 * (whichever is smaller for bandwidth optimization).
 *
 * For object properties with children:
 * - Skip value-level validation (pinned/allowed/regex/minmax)
 * - Recursively validate child properties
 *
 * @param depth - Current recursion depth (internal use)
 */
function validatePropertyConstraints(
  value: RuntimePropertyValue,
  constraints: PropertyConstraints,
  allEventIds: string[],
  depth = 0
): PropertyValidationResult {
  const result: PropertyValidationResult = {}

  // Guard against excessive nesting (potential malformed spec or DoS)
  if (depth > MAX_VALIDATION_DEPTH) {
    console.warn(
      `[Avo Inspector] Max validation depth (${MAX_VALIDATION_DEPTH}) exceeded, stopping recursive validation`
    )
    return result
  }

  // Handle nested object properties with children
  if (constraints.children) {
    // For object properties, recursively validate children
    // Object properties themselves have no value constraints to validate
    const childrenResults: Record<string, PropertyValidationResult> = {}
    const valueObj =
      typeof value === 'object' && value !== null && !Array.isArray(value)
        ? (value as Record<string, RuntimePropertyValue>)
        : {}

    for (const [childName, childConstraints] of Object.entries(constraints.children)) {
      const childValue = valueObj[childName]
      const childResult = validatePropertyConstraints(childValue, childConstraints, allEventIds, depth + 1)
      // Only include non-empty results
      if (childResult.failedEventIds || childResult.passedEventIds || childResult.children) {
        childrenResults[childName] = childResult
      }
    }

    if (Object.keys(childrenResults).length > 0) {
      result.children = childrenResults
    }

    return result
  }

  // Validate value constraints for non-object properties
  const failedIds = new Set<string>()

  // Check pinned values
  if (constraints.pinnedValues) {
    checkPinnedValues(value, constraints.pinnedValues, failedIds)
  }

  // Check allowed values
  if (constraints.allowedValues) {
    checkAllowedValues(value, constraints.allowedValues, failedIds)
  }

  // Check regex patterns
  if (constraints.regexPatterns) {
    checkRegexPatterns(value, constraints.regexPatterns, failedIds)
  }

  // Check min/max ranges
  if (constraints.minMaxRanges) {
    checkMinMaxRanges(value, constraints.minMaxRanges, failedIds)
  }

  // Calculate passed IDs
  const passedIds = allEventIds.filter((id) => !failedIds.has(id))
  const failedArray = Array.from(failedIds)

  // Return whichever list is smaller for bandwidth optimization
  // If both are empty, return empty object (no constraints)
  if (failedArray.length === 0 && passedIds.length === 0) {
    return {}
  }

  // Prefer passedEventIds only when strictly smaller than failedEventIds
  // When equal, prefer failedEventIds (more intuitive to see what failed)
  if (passedIds.length < failedArray.length && passedIds.length > 0) {
    return { passedEventIds: passedIds }
  } else if (failedArray.length > 0) {
    return { failedEventIds: failedArray }
  } else {
    return {}
  }
}

// =============================================================================
// CONSTRAINT VALIDATION FUNCTIONS
// =============================================================================

/**
 * Adds all IDs from the array to the set.
 * Helper to reduce code duplication in constraint check functions.
 */
function addIdsToSet(ids: string[], set: Set<string>): void {
  for (const id of ids) {
    set.add(id)
  }
}

/**
 * Converts runtime value to string for comparison.
 * - Primitives (null, undefined, boolean, number, string) -> String(value)
 * - Objects/Arrays -> JSON.stringify(value)
 */
function convertValueToString(value: RuntimePropertyValue): string {
  if (
    value === null ||
    value === undefined ||
    typeof value === 'boolean' ||
    typeof value === 'number' ||
    typeof value === 'string'
  ) {
    return String(value)
  }
  if (Array.isArray(value) || typeof value === 'object') {
    try {
      return JSON.stringify(value)
    } catch (e) {
      // Circular reference or other serialization error
      console.warn(`[Avo Inspector] Failed to stringify value: ${e}`)
      return String(value)
    }
  }
  return String(value)
}

/**
 * Checks pinned values constraint.
 * For each pinnedValue -> eventIds entry, if runtime value !== pinnedValue, those eventIds FAIL.
 */
function checkPinnedValues(
  value: RuntimePropertyValue,
  pinnedValues: Record<string, string[]>,
  failedIds: Set<string>
): void {
  const stringValue = convertValueToString(value)

  for (const [pinnedValue, eventIds] of Object.entries(pinnedValues)) {
    if (stringValue !== pinnedValue) {
      // Value doesn't match this pinned value, so these eventIds fail
      addIdsToSet(eventIds, failedIds)
    }
  }
}

/**
 * Checks allowed values constraint.
 * For each "[...array]" -> eventIds entry, if runtime value NOT in array, those eventIds FAIL.
 */
function checkAllowedValues(
  value: RuntimePropertyValue,
  allowedValues: Record<string, string[]>,
  failedIds: Set<string>
): void {
  const stringValue = convertValueToString(value)

  for (const [allowedArrayJson, eventIds] of Object.entries(allowedValues)) {
    try {
      const allowedArray: string[] = JSON.parse(allowedArrayJson)
      if (!allowedArray.includes(stringValue)) {
        // Value not in allowed list, so these eventIds fail
        addIdsToSet(eventIds, failedIds)
      }
    } catch (e) {
      // Invalid JSON - skip this constraint
      console.warn(`[Avo Inspector] Invalid allowed values JSON: ${allowedArrayJson}`)
    }
  }
}

/**
 * Checks regex pattern constraint.
 * For each pattern -> eventIds entry, if runtime value doesn't match pattern, those eventIds FAIL.
 */
function checkRegexPatterns(
  value: RuntimePropertyValue,
  regexPatterns: Record<string, string[]>,
  failedIds: Set<string>
): void {
  // Only check regex for string values
  if (typeof value !== 'string') {
    // Non-string values fail all regex constraints
    for (const eventIds of Object.values(regexPatterns)) {
      addIdsToSet(eventIds, failedIds)
    }
    return
  }

  for (const [pattern, eventIds] of Object.entries(regexPatterns)) {
    try {
      const regex = getOrCompileRegex(pattern)
      if (!regex.test(value)) {
        // Value doesn't match pattern, so these eventIds fail
        addIdsToSet(eventIds, failedIds)
      }
    } catch (e) {
      // Invalid regex - skip this constraint
      console.warn(`[Avo Inspector] Invalid regex pattern: ${pattern}`)
    }
  }
}

/**
 * Checks min/max range constraint.
 * For each "min,max" -> eventIds entry, if runtime value < min OR > max, those eventIds FAIL.
 */
function checkMinMaxRanges(
  value: RuntimePropertyValue,
  minMaxRanges: Record<string, string[]>,
  failedIds: Set<string>
): void {
  // Only check min/max for numeric values
  if (typeof value !== 'number') {
    // Non-numeric values fail all min/max constraints
    for (const eventIds of Object.values(minMaxRanges)) {
      addIdsToSet(eventIds, failedIds)
    }
    return
  }

  // NaN values fail all min/max constraints (comparisons with NaN are always false)
  if (Number.isNaN(value)) {
    console.warn(`[Avo Inspector] NaN value fails min/max constraint`)
    for (const eventIds of Object.values(minMaxRanges)) {
      addIdsToSet(eventIds, failedIds)
    }
    return
  }

  for (const [rangeStr, eventIds] of Object.entries(minMaxRanges)) {
    const [minStr, maxStr] = rangeStr.split(',')
    const min = parseFloat(minStr)
    const max = parseFloat(maxStr)

    if (isNaN(min) || isNaN(max)) {
      // Invalid range format - skip this constraint
      console.warn(`[Avo Inspector] Invalid min/max range: ${rangeStr}`)
      continue
    }

    if (value < min || value > max) {
      // Value out of range, so these eventIds fail
      addIdsToSet(eventIds, failedIds)
    }
  }
}
