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
