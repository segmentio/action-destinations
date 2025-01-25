// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * A unique identifier assigned to a specific audience in Segment.
   */
  computation_key: string
  /**
   * Hidden field used to access traits or properties objects from Engage payloads.
   */
  traits_or_props: {
    [k: string]: unknown
  }
  /**
   * The timestamp of when the event occurred.
   */
  timestamp?: string | number
  /**
   * This value must be specified as either OPTIN or OPTOUT. It defaults to the value defined in this destination settings.
   */
  default_permission_status?: string
}
