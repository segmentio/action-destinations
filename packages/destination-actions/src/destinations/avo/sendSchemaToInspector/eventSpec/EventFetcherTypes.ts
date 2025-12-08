/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * This file is generated. Internal development changes should be made in the generator
 * and the file should be re-generated. External contributions are welcome to submit
 * changes directly to this file, and we'll apply them to the generator internally.
 */

/**
 * Represents the specification for a single property in an event.
 * Supports recursive nesting for object types.
 */
export interface PropertySpec {
  /** Type - can be a primitive type string OR a nested object structure (recursive) */
  t: string | Record<string, PropertySpec>
  /** Required flag */
  r: boolean
  /** Is list (array) flag */
  l?: boolean
  /** Minimum value (for numeric types) */
  min?: number
  /** Maximum value (for numeric types) */
  max?: number
  /** Enum values (allowed values for the property) */
  v?: Array<string>
  /** Regex pattern for string validation */
  rx?: string
}

/** Represents a variant of an event with additional or modified properties. */
export interface EventVariant {
  /** Unique identifier for this variant */
  variantId: string
  /** Suffix to append to the base event name */
  nameSuffix: string
  /** Event ID for this variant */
  eventId: string
  /** Properties specific to this variant */
  props: Record<string, PropertySpec>
}

/**
 * Represents the complete specification for an event, including base event
 * and optional variants.
 */
export interface EventSpec {
  /** Base event specification */
  baseEvent: { name: string; id: string; props: Record<string, PropertySpec> }
  /** Optional variants of this event with additional/modified properties */
  variants?: Array<EventVariant>
}

/** Cache entry for storing event specs with metadata. */
export interface EventSpecCacheEntry {
  /** The cached event specification */
  spec: EventSpec
  /** Timestamp when this entry was cached */
  timestamp: number
  /** Number of events processed since this entry was cached */
  eventCount: number
}

/** Parameters for fetching event specifications from the API. */
export interface FetchEventSpecParams {
  /** The API key */
  apiKey: string
  /** The stream ID */
  streamId: string
  /** The name of the event */
  eventName: string
}

// -----------------------------------------------------------------------------
// WIRE TYPES (API Response Format)
// -----------------------------------------------------------------------------

export interface PropertyConstraintsWire {
  t: string | Record<string, PropertyConstraintsWire> // type or nested schema
  r: boolean // required
  l?: boolean // is list
  v?: string[] // allowed values
  min?: number // min value
  max?: number // max value
  rx?: string // regex pattern
}

export interface EventSpecResponseWire {
  branchId: string
  baseEvent: {
    id: string
    name: string
    props: Record<string, PropertyConstraintsWire>
  }
  variants: Array<{
    eventId: string
    props: Record<string, PropertyConstraintsWire>
  }>
}

// -----------------------------------------------------------------------------
// VALIDATOR TYPES (Derived/Simplified from legacy types)
// -----------------------------------------------------------------------------

export interface EventSpecEntry {
  branchId?: string
  baseEventId: string
  variantIds: string[]
  props: Record<string, PropertyConstraints>
}

export interface EventSpecResponse {
  metadata: Record<string, any>
  events: EventSpecEntry[]
}

export interface PropertyConstraints {
  type: string
  required: boolean
  pinnedValues?: Record<string, string[]>
  allowedValues?: Record<string, string[]>
  regexPatterns?: Record<string, string[]>
  minMaxRanges?: Record<string, string[]>
  children?: Record<string, PropertyConstraints>
}

export interface PropertyValidationResult {
  passedEventIds?: string[]
  failedEventIds?: string[]
  children?: Record<string, PropertyValidationResult>
}

export interface ValidationResult {
  metadata: Record<string, any>
  propertyResults: Record<string, PropertyValidationResult>
}
