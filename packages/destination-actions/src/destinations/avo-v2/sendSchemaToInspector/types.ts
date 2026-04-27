export type SchemaChild = string | EventProperty | SchemaChild[]

export interface EventProperty {
  propertyName: string
  propertyType: string
  encryptedPropertyValue?: string
  children?: SchemaChild
  /** Event/variant IDs that FAILED validation (present if smaller or equal to passed) */
  failedEventIds?: string[]
  /** Event/variant IDs that PASSED validation (present if smaller than failed) */
  passedEventIds?: string[]
}

export interface BaseBody {
  appName: string
  appVersion: string
  libVersion: string
  libPlatform: string
  messageId: string
  createdAt: string
  sessionId: string
  publicEncryptionKey?: string
}

export interface EventSchemaBody extends BaseBody {
  type: 'event'
  streamId: string
  eventName: string
  eventProperties: Array<EventProperty>
  eventId: string | null
  eventHash: string | null
  eventSpecMetadata?: EventSpecMetadata
}

export interface PropertyConstraintWire {
  t: string | Record<string, PropertyConstraintWire> // type or nested schema
  r: boolean // required
  l?: boolean // is list
  v?: string[] | Record<string, string[]> // allowed values: either array (legacy) or object mapping JSON-stringified arrays to event IDs
  min?: number // min value
  max?: number // max value
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
  events: Array<EventSpecWire>
  metadata: EventSpecMetadata
}

export interface EventSpecWire {
  b: string // branchId
  id: string // baseEventId
  vids: string[] // variantIds
  p: Record<string, PropertyConstraintWire>
}

export interface EventSpec {
  events: Array<Event>
  metadata: EventSpecMetadata
}

export interface Event {
  branchId: string
  baseEventId: string
  variantIds: string[]
  props: Record<string, PropertyConstraint>
}

export interface PropertyConstraint {
  type: string
  required: boolean
  isList?: boolean
  pinnedValues?: Record<string, string[]>
  allowedValues?: Record<string, string[]>
  minMaxRanges?: Record<string, string[]>
  children?: Record<string, PropertyConstraint>
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

export type RuntimePropertyValue = string | number | boolean | null | undefined | object | Array<RuntimePropertyValue>

export type RuntimeProperties = Record<string, RuntimePropertyValue>
