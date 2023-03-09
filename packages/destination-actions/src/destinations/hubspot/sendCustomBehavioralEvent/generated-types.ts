// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The internal event name assigned by HubSpot. This can be found in your HubSpot account. Events must be predefined in HubSpot. Please input the full internal event name including the `pe` prefix (i.e. `pe<HubID>_event_name`). Learn how to find the internal name in [HubSpot’s documentation](https://knowledge.hubspot.com/analytics-tools/create-custom-behavioral-events).
   */
  eventName: string
  /**
   * The time when this event occurred. If this isn't set, the current time will be used.
   */
  occurredAt?: string | number
  /**
   * The email of the contact associated with this event. This is required if no user token or object ID is provided.
   */
  email?: string
  /**
   * The user token (utk) of the contact associated with this event. This is required if no email or object ID is provided.
   */
  utk?: string
  /**
   * The ID of the object associated with this event. This can be the HubSpot contact ID, company ID, or ID of any other object. This is required if no email or user token is provided.
   */
  objectId?: string
  /**
   * Default or custom properties that describe the event. On the left-hand side, input the internal name of the property as seen in your HubSpot account. On the right-hand side, map the Segment field that contains the value. See more information in [HubSpot’s documentation](https://knowledge.hubspot.com/analytics-tools/create-custom-behavioral-events#add-and-manage-event-properties).
   */
  properties?: {
    [k: string]: unknown
  }
}
