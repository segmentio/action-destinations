// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
<<<<<<< HEAD
   * The internal event name assigned by HubSpot. This can be found in your HubSpot account. Events must be predefined in HubSpot. Learn how to find the internal name in [HubSpot’s documentation](https://knowledge.hubspot.com/analytics-tools/create-custom-behavioral-events?_ga=2.219778269.578939721.1663963266-497800475.1660075188#define-the-api-call).
=======
   * The internal event name assigned by HubSpot. This can be found in your HubSpot account. Events must be predefined in HubSpot. Learn how to find the internal name in [HubSpot’s documentation](https://knowledge.hubspot.com/analytics-tools/create-custom-behavioral-events).
>>>>>>> CONMAN-199
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
   * Default or custom properties that describe the event. See more information in [HubSpot’s documentation](https://knowledge.hubspot.com/analytics-tools/create-custom-behavioral-events#add-and-manage-event-properties).
   */
  properties?: {
    [k: string]: unknown
  }
}
