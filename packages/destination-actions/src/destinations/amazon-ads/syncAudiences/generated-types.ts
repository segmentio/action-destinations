// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Records to create and upload audiences to Amazon DSP.
   */
  records: {
    /**
     * This is an external user identifier defined by data providers.
     */
    external_user_id: string
    /**
     * A specific key used to define action type.
     */
    user_action: string
    /**
     * A String value representing ISO 3166-1 alpha-2 country code for the members in this audience.
     */
    country_code?: string
    measurements?: string
    /**
     * List of hashed personally-identifiable information records to be matched with Amazon identities for future use. All inputs must be properly normalized and SHA-256 hashed.
     */
    hashedPII: {
      firstname?: string
      address?: string
      phone?: string
      city?: string
      state?: string
      email?: string
      lastname?: string
      postal?: string
    }[]
  }[]
  /**
   * An number value representing the Amazon audience identifier. This is the identifier that is returned during audience creation.
   */
  audienceId: number
}
