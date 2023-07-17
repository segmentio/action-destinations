// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Whether or not the message should actually get sent.
   */
  send?: boolean
  /**
   * Whether or not trait enrich from event (i.e without profile api call)
   */
  traitEnrichment?: boolean
  /**
   * User ID in Segment
   */
  userId?: string
  /**
   * Email to send to when testing
   */
  toEmail?: string
  /**
   * Verified domain in Sendgrid
   */
  fromDomain?: string | null
  /**
   * From Email
   */
  fromEmail: string
  /**
   * From Name displayed to end user email
   */
  fromName: string
  /**
   * Whether "reply to" settings are the same as "from"
   */
  replyToEqualsFrom?: boolean
  /**
   * The Email used by user to Reply To
   */
  replyToEmail: string
  /**
   * The Name used by user to Reply To
   */
  replyToName: string
  /**
   * BCC list of emails
   */
  bcc: string
  /**
   * Preview Text
   */
  previewText?: string
  /**
   * Subject for the email to be sent
   */
  subject: string
  /**
   * The message body
   */
  body?: string
  /**
   * URL to the message body
   */
  bodyUrl?: string
  /**
   * The type of body which is used generally html | design
   */
  bodyType: string
  /**
   * The HTML content of the body
   */
  bodyHtml?: string
  /**
   * Subscription group ID
   */
  groupId?: string
  /**
   * Send email without subscription check
   */
  byPassSubscription?: boolean
  /**
   * Any API lookup configs that are needed to send the template
   */
  apiLookups?: {
    /**
     * The id of the API lookup for use in logging & observability
     */
    id?: string
    /**
     * The name of the API lookup referenced in liquid syntax
     */
    name: string
    /**
     * The URL endpoint to call
     */
    url: string
    /**
     * The request method, e.g. GET/POST/etc.
     */
    method: string
    /**
     * The cache TTL in ms
     */
    cacheTtl: number
    /**
     * The request body for use with POST/PUT/PATCH requests
     */
    body?: string
    /**
     * Headers in JSON to be sent with the request
     */
    headers?: {
      [k: string]: unknown
    }
    /**
     * The response type of the request. Currently only supporting JSON.
     */
    responseType: string
  }[]
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
    /**
     * Unsubscribe link for the end user
     */
    unsubscribeLink?: string
    /**
     * Preferences link for the end user
     */
    preferencesLink?: string
    /**
     * Subscription groups and their statuses for this id.
     */
    groups?: {
      id?: string
      /**
       * Group subscription status true is subscribed, false is unsubscribed or did-not-subscribe
       */
      isSubscribed?: boolean
      /**
       * Group unsubscribe link for the end user
       */
      groupUnsubscribeLink?: string
    }[]
  }[]
  /**
   * Additional custom args that we be passed back opaquely on webhook events
   */
  customArgs?: {
    [k: string]: unknown
  }
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
