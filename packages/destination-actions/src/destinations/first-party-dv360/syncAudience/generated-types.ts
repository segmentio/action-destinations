// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * A list of the user's emails. If not already hashed, the system will hash them before use.
   */
  emails?: string
  /**
   * A list of the user's phone numbers. If not already hashed, the system will hash them before use.
   */
  phoneNumbers?: string
  /**
   * A list of the user's zip codes.
   */
  zipCodes?: string
  /**
   * The user's first name. If not already hashed, the system will hash it before use.
   */
  firstName?: string
  /**
   * The user's last name. If not already hashed, the system will hash it before use.
   */
  lastName?: string
  /**
   * The country code of the user.
   */
  countryCode?: string
  /**
   * A list of mobile device IDs defining Customer Match audience members. The size of mobileDeviceIds mustn't be greater than 500,000.
   */
  mobileDeviceIds?: string
  /**
   * Consent to use the data for advertising purposes. Events with consent denied are not sent to Display & Video 360, as the API rejects any request containing denied consent.
   */
  ad_user_data?: string
  /**
   * Consent to use the data for ad personalization. Events with consent denied are not sent to Display & Video 360, as the API rejects any request containing denied consent.
   */
  ad_personalization?: string
  /**
   * The ID of the DV360 Audience.
   */
  external_id?: string
  /**
   * The Advertiser ID associated with the DV360 Audience.
   */
  advertiser_id?: string
  /**
   * The type of the DV360 Audience.
   */
  audience_type?: string
  /**
   * Enable batching of requests.
   */
  enable_batching: boolean
  /**
   * Maximum number of events to include in each batch. Actual batch sizes may be lower.
   */
  batch_size: number
  /**
   * The keys to use for batching the events.
   */
  batch_keys?: string[]
}
// Generated file. DO NOT MODIFY IT BY HAND.

export interface RetlOnMappingSaveInputs {
  /**
   * Choose to either create a new Customer Match audience in Display & Video 360, or connect to an audience which already exists there.
   */
  operation: string
  /**
   * The ID of your advertiser, used throughout Display & Video 360. Use this ID when you contact Display & Video 360 support to help our teams locate your specific account.
   */
  advertiserId: string
  /**
   * The display name of the audience to create in Display & Video 360.
   */
  audienceName?: string
  /**
   * The type of the audience to create.
   */
  audienceType?: string
  /**
   * The duration in days that an entry remains in the audience after the qualifying event. The set value must be greater than 0 and less than or equal to 540.
   */
  membershipDurationDays?: number
  /**
   * The description of the audience.
   */
  description?: string
  /**
   * The appId matches with the type of the mobileDeviceIds being uploaded. Required for CUSTOMER_MATCH_DEVICE_ID audiences.
   */
  appId?: string
  /**
   * The ID of the audience in Display & Video 360 to connect this mapping to.
   */
  existingAudienceId?: string
}
// Generated file. DO NOT MODIFY IT BY HAND.

export interface RetlOnMappingSaveOutputs {
  /**
   * The ID of the audience in Display & Video 360 this mapping is connected to.
   */
  audienceId: string
  /**
   * The ID of the advertiser which owns the audience.
   */
  advertiserId: string
  /**
   * The type of the audience in Display & Video 360.
   */
  audienceType: string
  /**
   * The app ID associated with the mobile device IDs in the audience.
   */
  appId?: string
}
