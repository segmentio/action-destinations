/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * This file is generated. Internal development changes should be made in the generator
 * and the file should be re-generated. External contributions are welcome to submit
 * changes directly to this file, and we'll apply them to the generator internally.
 */

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
  v?: string[] | Record<string, string[]> // allowed values: either array (legacy) or object mapping JSON-stringified arrays to event IDs
  min?: number // min value
  max?: number // max value
  rx?: string // regex pattern
}

/** Metadata returned with the event spec response. */
export interface EventSpecMetadata {
  /** Schema identifier */
  schemaId: string
  /** Branch identifier */
  branchId: string
  /** Latest action identifier */
  latestActionId: string
  /** Optional source identifier */
  sourceId?: string
}

export interface EventSpecResponseWire {
  events: Array<{
    b: string // branchId
    id: string // baseEventId
    vids: string[] // variantIds
    p: Record<string, PropertyConstraintsWire> // props
  }>
  metadata: EventSpecMetadata
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
  metadata: EventSpecMetadata
  events: EventSpecEntry[]
}

export interface PropertyConstraints {
  type: string
  required: boolean
  isList?: boolean
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
  metadata: EventSpecMetadata
  propertyResults: Record<string, PropertyValidationResult>
}
