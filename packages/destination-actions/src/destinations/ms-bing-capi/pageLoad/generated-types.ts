// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * TODO - description for this field
   */
  data: {
    /**
     * The type of event being sent to the Bing API.
     */
    eventType?: string
    /**
     * EventID for deduplication. Defaults to the Segment messageId.
     */
    eventId?: string
    /**
     * Event action for custom conversion goals, if used.
     */
    eventName?: string
    /**
     * The time the event occurred.
     */
    eventTime?: string
    /**
     * URL of the page, used for example: “destination URL” goals. Required for pageLoad events.
     */
    eventSourceUrl?: string
    /**
     * Page load id that links to 0+ custom events from the same page. Format as a v4 UUID.
     */
    pageLoadId?: string
    /**
     * Referrer of the page, used for example: "referral" remarketing lists.
     */
    referrerUrl?: string
    /**
     * Title of the page.
     */
    pageTitle?: string
    /**
     * Page keywords - SEO meta keyworls.
     */
    keywords?: string
    /**
     * A list of user identifiers associated with the event.
     */
    userData?: {
      /**
       * User agent string of the client device.
       */
      clientUserAgent?: string
      /**
       * Guest user anonymous ID.
       */
      anonymousId?: string
      /**
       * Authenticated user id (anonymized) if user is logged in. Also used for ID sync
       */
      externalId?: string
      /**
       * Email address of the user. Accepts a clear text or hashed email address. Segment will ensure the email address is hashed before sending to Bing Ads.
       */
      em?: string
      /**
       * Phone number of the user. Accepts a clear text or hashed phone number. Segment will ensure the phone number is hashed before sending to Bing Ads.
       */
      ph?: string
      /**
       * IP address of the client device.
       */
      clientIpAddress?: string
      /**
       * Microsoft Last Click ID.
       */
      msclkid?: string
    }
  }
}
