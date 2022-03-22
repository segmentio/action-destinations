// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Arbitrary additional JSON data associated with the customer profile.
   */
  attributes?: {
    [k: string]: unknown
  }
  /**
   * Unique identifier of the customer profile.
   */
  customerProfileId: string
  /**
   * This composes 2 lists of audience; to associate and dissociate with the customer profile.
   */
  audiencesChanges?: {
    /**
     * You should get this audience ID from Talon.One.
     */
    addAudienceIds?: number[]
    /**
     * You should get this audience ID from Talon.One.
     */
    deleteAudienceIds?: number[]
  }
  /**
   * This runs rule engine in Talon.One upon updating customer profile. Set to true to trigger rules.
   */
  runRuleEngine?: boolean
}
