// Generated file. DO NOT MODIFY IT BY HAND.

export interface Settings {
  /**
   * The ID of the advertiser in Google Product.
   */
  advertiserAccountId: string
}
// Generated file. DO NOT MODIFY IT BY HAND.

export interface AudienceSettings {
  /**
   * The product for which you want to create or manage audiences.
   */
  product: string
  /**
   * The ID of the product destination, used to identify the specific destination for audience management.
   */
  productDestinationId: string
  /**
   * Customer match upload key types. Required if you are using UserLists. Not used by the other actions.
   */
  externalIdType?: string
  /**
   * A string that uniquely identifies a mobile application from which the data was collected. Required if external ID type is mobile advertising ID
   */
  app_id?: string
  /**
   * The description of the audience.
   */
  description?: string
  /**
   * The duration in days that an entry remains in the audience after the qualifying event. If the audience has no expiration, set the value of this field to 10000. Otherwise, the set value must be greater than 0 and less than or equal to 540.
   */
  membershipDurationDays: string
}
