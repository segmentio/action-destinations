// Generated file. DO NOT MODIFY IT BY HAND.

export interface Settings {}
// Generated file. DO NOT MODIFY IT BY HAND.

export interface AudienceSettings {
  /**
   * The ID of your advertiser, used throughout Display & Video 360. Use this ID when you contact Display & Video 360 support to help our teams locate your specific account.
   */
  advertiserId: string
  /**
   * The type of the audience.
   */
  audienceType: string
  /**
   * The description of the audience.
   */
  description?: string
  /**
   * The appId matches with the type of the mobileDeviceIds being uploaded. **Required for CUSTOMER_MATCH_DEVICE_ID Audience Types.**
   */
  appId?: string
  /**
   * The duration in days that an entry remains in the audience after the qualifying event. If the audience has no expiration, set the value of this field to 10000. Otherwise, the set value must be greater than 0 and less than or equal to 540.
   */
  membershipDurationDays: string
}
