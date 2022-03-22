// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * An array of JSON objects that contains customer profile identifier and list of audiences to associate and dissociate with the indicated customer profile. Customer profile ID and at least one audience ID are required.
   */
  data: {
    /**
     * Unique identifier of the customer profile.
     */
    customerProfileId: string
    /**
     * You should get this audience ID from Talon.One.
     */
    addAudienceIds?: number[]
    /**
     * You should get this audience ID from Talon.One.
     */
    deleteAudienceIds?: number[]
  }[]
}
