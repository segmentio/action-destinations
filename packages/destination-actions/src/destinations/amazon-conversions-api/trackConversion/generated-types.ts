// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The name of the imported event.
   */
  name: string
  /**
   * The standard Amazon event type.
   */
  eventType: string
  /**
   * The platform from which the event was sourced.
   */
  eventActionSource: string
  /**
   * ISO 3166-1 alpha-2 country code (e.g., US, GB).
   */
  countryCode: string
  /**
   * The reported timestamp of when the event occurred in ISO format (YYYY-MM-DDThh:mm:ssTZD).
   */
  timestamp: string
  /**
   * The value of the event.
   */
  value?: number
  /**
   * The currencyCode associated with the 'value' of the event in ISO-4217 format. Only applicable for OFF_AMAZON_PURCHASES event type.
   */
  currencyCode?: string
  /**
   * The number of items purchased (only for OFF_AMAZON_PURCHASES).
   */
  unitsSold?: number
  /**
   * The client specified id for the event. For events with the same clientDedupeId only the latest event will be kept.
   */
  clientDedupeId?: string
  /**
   * Customer email address associated with the event, Used for attribution to traffic events. Out of email, phone, firstName, lastName, address, city, state, postalCode, maid, rampId, matchId fields, at-least one valid customer identifier must be provided.
   */
  email?: string
  /**
   * Customer phone number associated with the event. Used for attribution to traffic events. Out of email, phone, firstName, lastName, address, city, state, postalCode, maid, rampId, matchId fields, at-least one valid customer identifier must be provided.
   */
  phone?: string
  /**
   * Customer first name associated with the event. Used for attribution to traffic events. Out of email, phone, firstName, lastName, address, city, state, postalCode, maid, rampId, matchId fields, at-least one valid customer identifier must be provided.
   */
  firstName?: string
  /**
   * Customer last name associated with the event. Used for attribution to traffic events. Out of email, phone, firstName, lastName, address, city, state, postalCode, maid, rampId, matchId fields, at-least one valid customer identifier must be provided.
   */
  lastName?: string
  /**
   * Customer address associated with the event. Used for attribution to traffic events. Out of email, phone, firstName, lastName, address, city, state, postalCode, maid, rampId, matchId fields, at-least one valid customer identifier must be provided.
   */
  address?: string
  /**
   * Customer city associated with the event. Used for attribution to traffic events. Out of email, phone, firstName, lastName, address, city, state, postalCode, maid, rampId, matchId fields, at-least one valid customer identifier must be provided.
   */
  city?: string
  /**
   * Customer state associated with the event. Used for attribution to traffic events. Out of email, phone, firstName, lastName, address, city, state, postalCode, maid, rampId, matchId fields, at-least one valid customer identifier must be provided.
   */
  state?: string
  /**
   * Customer postal code associated with the event. Used for attribution to traffic events. Out of email, phone, firstName, lastName, address, city, state, postalCode, maid, rampId, matchId fields, at-least one valid customer identifier must be provided.
   */
  postalCode?: string
  /**
   * Mobile advertising ID (MAID). ADID, IDFA, or FIREADID can be passed into this field. Used for attribution to traffic events. Out of email, phone, firstName, lastName, address, city, state, postalCode, maid, rampId, matchId fields, at-least one valid customer identifier must be provided.
   */
  maid?: string
  /**
   * RAMP ID for the customer. Used for attribution to traffic events. Out of email, phone, firstName, lastName, address, city, state, postalCode, maid, rampId, matchId fields, at-least one valid customer identifier must be provided.
   */
  rampId?: string
  /**
   * Match ID for the customer. Used for attribution to traffic events. Out of email, phone, firstName, lastName, address, city, state, postalCode, maid, rampId, matchId fields, at-least one valid customer identifier must be provided.
   */
  matchId?: string
  /**
   * A list of flags for signaling how an event shall be processed. Events marked for limited data use will not be processed.
   */
  dataProcessingOptions?: string[]
  /**
   * Describes consent given by the user for advertising purposes. For EU advertisers, it is required to provide one of geo, amazonConsent, tcf, or gpp.
   */
  consent?: {
    /**
     * Captures the user's geographic information for consent checking.
     */
    geo?: {
      /**
       * IP address of the user associated with the conversion event.
       */
      ipAddress?: string
    }
    /**
     * Captures whether a user has consented to data use for advertising purposes.
     */
    amazonConsent?: {
      /**
       * Whether the user has consented to cookie based tracking.
       */
      amznAdStorage?: string
      /**
       * Whether the user has consented to use personal data for advertising.
       */
      amznUserData?: string
    }
    /**
     * An encoded Transparency and Consent Framework (TCF) string describing user consent choices.
     */
    tcf?: string
    /**
     * An encoded Global Privacy Platform (GPP) string describing user privacy preferences.
     */
    gpp?: string
  }
  /**
   * Custom attributes associated with the event to provide additional context.
   */
  customAttributes?: {
    /**
     * Name of the custom attribute. Only letters, numbers and the underscore character are allowed.
     */
    name: string
    /**
     * Data type of the custom attribute.
     */
    dataType?: string
    /**
     * Value of the custom attribute. Max length 256 characters.
     */
    value: string
  }[]
}
