// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The name of the event to send to Hubspot.
   */
  event_name: string
  /**
   * Details of the record to associate the event with
   */
  record_details: {
    /**
     * The type of Hubspot Object to associate the event with.
     */
    object_type: string
    /**
     * The numeric Object ID of the object to associate the event with. For example a contact id or a visitor id value. Works for Contacts, Companies, Deals, Tickets and Custom Objects.
     */
    object_id?: number
    /**
     * The email address of the Contact to associate the event with. This field only works for Contact objects.
     */
    email?: string
    /**
     * The user token of the Contact to associate the event with.
     */
    utk?: string
  }
  /**
   * Properties to send with the event.
   */
  properties?: {
    [k: string]: unknown
  }
  /**
   * The time when this event occurred.
   */
  occurred_at?: string | number
}
