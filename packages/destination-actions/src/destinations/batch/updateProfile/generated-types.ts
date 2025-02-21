// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Identifiant(s) de l'utilisateur
   */
  identifiers?: {
    /**
     * The unique profile identifier
     */
    custom_id: string
  }
  /**
   * Profile data
   */
  attributes?: {
    /**
     * The profile's email
     */
    $email_address?: string | null
    /**
     * The profile's marketing emails subscription. You can set it to subscribed , unsubscribed , or null to reset the marketing emails subscription.
     */
    $email_marketing?: string | null
    /**
     * The profile's phone number
     */
    $phone_number?: string | null
    /**
     * The profile's marketing SMS subscription. You can set it to subscribed , unsubscribed , or null to reset the marketing SMS subscription.
     */
    $sms_marketing?: string | null
    /**
     * The profile's language.
     */
    $language?: string | null
    /**
     * The profile's region
     */
    $region?: string | null
    /**
     * The profile’s time zone name from IANA Time Zone Database  (e.g., “Europe/Paris”). Only valid time zone values will be set.
     */
    $timezone?: string | null
    /**
     * The profile’s custom attributes
     */
    properties?: {
      [k: string]: unknown
    }
    /**
     * Maximum number of attributes to include in each batch.
     */
    batch_size?: number
  }
}
