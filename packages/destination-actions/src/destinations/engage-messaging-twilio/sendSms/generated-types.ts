// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * What type of message is being sent?
   */
  messageType?: string
  /**
   * If you are sending whatsApp messages, The template you sending for whatsApp
   */
  contentSid?: string
  /**
   * Content personalization variables/merge tags for your whatsApp message
   */
  contentVariables?: string
  /**
   * User ID in Segment
   */
  userId: string
  /**
   * Number to send SMS to when testing
   */
  toNumber?: string
  /**
   * The Twilio Phone Number, Short Code, or Messaging Service to send SMS from.
   */
  from: string
  /**
   * Message to send
   */
  body: string
  /**
   * Additional custom arguments that will be opaquely sent back on webhook events
   */
  customArgs?: {
    [k: string]: unknown
  }
  /**
   * Connection overrides are configuration supported by twilio webhook services. Must be passed as fragments on the callback url
   */
  connectionOverrides?: string
  /**
   * Whether or not the message should actually get sent.
   */
  send?: boolean
  /**
   * Whether or not trait enrich from event (i.e without profile api call)
   */
  traitEnrichment?: boolean
  /**
   * An array of user profile identity information.
   */
  externalIds?: {
    /**
     * A unique identifier for the collection.
     */
    id?: string
    /**
     * The external ID contact type.
     */
    type?: string
    /**
     * The subscription status for the identity.
     */
    subscriptionStatus?: string
  }[]
  /**
   * A user profile's traits
   */
  traits?: {
    [k: string]: unknown
  }
  /**
   * Time of when the actual event happened.
   */
  eventOccurredTS?: string
}
