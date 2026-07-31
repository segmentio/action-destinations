// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The unique key for an event definition in Salesforce Marketing Cloud. The event defintion must be predefined in SFMC.
   */
  eventDefinitionKey: string
  /**
   * The unique identifier that identifies a subscriber or a contact.
   */
  contactKey: string
  /**
   * The properties of the event. Fields must be created in the event definition schema before sending data for it. On the left-hand side, input the SFMC field name exactly how it appears in the event definition schema. On the right-hand side, map the Segment field that contains the corresponding value.
   */
  data?: {
    [k: string]: unknown
  }
}
