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
   * The platform from which the event was sourced. If no value is provided, then website is used as default.
   */
  eventActionSource: string
  /**
   * ISO 3166-1 alpha-2 country code. e.g., US, GB. Also accepts locale codes. e.g en-US, en-GB.
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
   * The number of items purchased. Only applicable for OFF_AMAZON_PURCHASES event type. If not provided on the event, a default of 1 will be applied.
   */
  unitsSold?: number
  /**
   * Amazon Conversions API uses the `clientDedupeId` field to prevent duplicate events. By default, Segment maps the messageId to this field. For events with the same clientDedupeId, only the latest event will be processed. Please be advised that deduplication occurs across all event types, rather than being limited to individual event types.
   */
  clientDedupeId?: string
  /**
   * Match keys are used to identify the customer associated with the event for attribution. At least one match key must be provided.
   */
  matchKeys: {
    /**
     * Customer email address associated with the event.
     */
    email?: string
    /**
     * Customer phone number associated with the event.
     */
    phone?: string
    /**
     * Customer first name associated with the event.
     */
    firstName?: string
    /**
     * Customer last name associated with the event.
     */
    lastName?: string
    /**
     * Customer address associated with the event.
     */
    address?: string
    /**
     * Customer city associated with the event.
     */
    city?: string
    /**
     * Customer state associated with the event.
     */
    state?: string
    /**
     * Customer postal code associated with the event.
     */
    postalCode?: string
    /**
     * Mobile advertising ID (MAID). ADID, IDFA, or FIREADID can be passed into this field.
     */
    maid?: string
    /**
     * RAMP ID for the customer. Used for attribution to traffic events.
     */
    rampId?: string
    /**
     * Match ID serves as an anonymous, opaque unique identifier that corresponds to individual users within an advertiser system, such as loyalty membership identifications and order references. This functionality enables advertisers to precisely monitor campaign effectiveness while maintaining customer data privacy, eliminating the need to share sensitive information like hashed email addresses or phone numbers with Amazon, particularly when analyzing complex customer journeys across multiple channels and devices. The advertisers who implement the Amazon Advertising Tag (AAT) on their websites can transmit match_id as a parameter in conjunction with online event tracking. The Amazon system subsequently correlates these identifiers with users through cookies or hashed Personally Identifiable Information (PII). In instances where users complete offline conversions, advertisers can report these activities through the Conversions API (CAPI) utilizing the corresponding match_id, ensuring seamless cross-channel attribution.
     */
    matchId?: string
  }
  /**
   * A list of flags for signaling how an event shall be processed. Events marked for limited data use will not be processed.
   */
  dataProcessingOptions?: string[]
  /**
   * Describes consent given by the user for advertising purposes. For EU advertisers, it is required to provide one of Geo ipAddress, amazonConsent, tcf, or gpp.
   */
  consent?: {
    /**
     * Captures the user's geographic information (IP address) for consent checking.
     */
    ipAddress?: string
    /**
     * Amazon Consent Format: Captures whether the user has consented to cookie based tracking.
     */
    amznAdStorage?: string
    /**
     * Amazon Consent Format: Captures whether the user has consented to use personal data for advertising.
     */
    amznUserData?: string
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
    [k in string]: unknown
  }
  /**
   * The Amazon impression ID associated with the event.
   */
  amazonImpressionId?: string
  /**
   * The Amazon click ID associated with the event.
   */
  amazonClickId?: string
  /**
   * When enabled, Segment will send data in batching.
   */
  enable_batching: boolean
  /**
   * Maximum number of events to include in each batch. Actual batch sizes may be lower.
   */
  batch_size?: number
}
