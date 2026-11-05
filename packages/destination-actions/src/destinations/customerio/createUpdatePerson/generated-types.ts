// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The ID used to uniquely identify a person in Customer.io. [Learn more](https://customer.io/docs/identifying-people/#identifiers).
   */
  id?: string
  /**
   * An optional anonymous ID. This is used to tie anonymous events to this person. [Learn more](https://customer.io/docs/anonymous-events/).
   */
  anonymous_id?: string
  /**
   * The person's email address.
   */
  email?: string
  /**
   * A timestamp of when the person was created.
   */
  created_at?: string
  /**
   * The ID used to uniquely identify an object in Customer.io. [Learn more](https://customer.io/docs/object-relationships).
   */
  group_id?: string
  /**
   * Optional attributes for the person. When updating a person, attributes are added or updated, not removed.
   */
  custom_attributes?: {
    [k: string]: unknown
  }
  /**
   * Optional attributes for the relationship between the object and the user. When updating an object, attributes are added or updated, not removed.
   */
  relationship_attributes?: {
    [k: string]: unknown
  }
  /**
   * A timestamp of when the person was identified. Default is current date and time. Used for ordering updates to the person.
   */
  timestamp?: string
  /**
   * Convert dates to Unix timestamps (seconds since Epoch).
   */
  convert_timestamp?: boolean
  /**
   * The person's IP address. Customer.io uses it to derive geolocation attributes (city, region, country, timezone) when geolocation is enabled in your workspace. Defaults to `context.ip`. Only forwarded for events from Segment's web and mobile libraries, where `context.ip` is the end user's address; events from server-side libraries are skipped unless **Forward IP from server-side sources** is enabled.
   */
  customer_ip?: string
  /**
   * Send the IP Address for events from Segment's server-side libraries too. Only enable this if your server sets `context.ip` to the end user's address; otherwise Customer.io would geolocate people to your server's location.
   */
  forward_server_ip?: boolean
  /**
   * The Segment library that sent the event. Used to decide whether the IP Address is forwarded.
   */
  source_library?: string
  /**
   * The ID used to uniquely identify a custom object type in Customer.io. [Learn more](https://customer.io/docs/object-relationships).
   */
  object_type_id?: string
  /**
   * Set as true to ensure Segment sends data to Customer.io in batches.
   */
  enable_batching?: boolean
  /**
   * Maximum number of events to include in each batch. Actual batch sizes may be lower.
   */
  batch_size?: number
}
