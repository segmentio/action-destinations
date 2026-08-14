// Request type definitions for Heap's partner integration API.
// Responses are ignored — the platform handles retries on HTTP errors.

// How object/array values in properties and traits are handled before sending.
export type NestedMode = 'flatten' | 'stringify' | 'drop'

/**
 * At least one key is required. `user_id` is Heap's own internal numeric ID
 * (numeric string, 0–2^53), NOT an arbitrary Segment userId.
 */
export interface UserIdentifier {
  identity?: string // arbitrary identifier (email, username…), 1–255 chars
  anonymous_id?: string // Segment's anonymousId, any string
  user_id?: string // Heap internal numeric id only
  email?: string
}

// Flattened, stringified properties — Heap's track `custom_properties`
// accepts string values only.
export interface FlatProperties {
  [k: string]: string
}

export interface HeapTrackEvent {
  event: string
  user_identifier: UserIdentifier // ≥1 key
  custom_properties?: FlatProperties
  idempotency_key?: string // ≥8 chars
  timestamp?: string | number // ISO8601 or unix
}

/** POST /api/integrations/track */
export interface TrackJSON {
  app_id: string // required
  library: 'server' // required, "server"
  events: HeapTrackEvent[]
}

/** POST /api/integrations/add_user_properties */
export interface AddUserPropertiesJSON {
  app_id: string // required
  library: 'server' // required, "server"
  users: [
    {
      user_identifier: {
        identity: string // required
      }
      custom_properties: {
        [k: string]: string | number | boolean | null // required
      }
    }
  ]
}
