// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The type of Customer Match audience this mapping syncs to. This must match the type of the audience in Display & Video 360, and controls which identifier fields are shown below.
   */
  audience_type: string
  /**
   * The contact details used to match the user in Display & Video 360. This field is only used when syncing to a Customer Match Contact Info audience. It is ignored when syncing to a Mobile Device ID audience.
   */
  contact_info?: {
    /**
     * The user's email address. A single value, or several separated by commas. If not already hashed, the system will hash them before use.
     */
    emails?: string
    /**
     * The user's phone number in E.164 format. A single value, or several separated by commas. If not already hashed, the system will hash them before use.
     */
    phoneNumbers?: string
    /**
     * The user's zip code. A single value, or several separated by commas. Zip Code, First Name, Last Name and Country Code must all be provided together. If any of them is missing, none of them are sent, and no error is raised.
     */
    zipCodes?: string
    /**
     * The user's first name. If not already hashed, the system will hash it before use. Zip Code, First Name, Last Name and Country Code must all be provided together. If any of them is missing, none of them are sent, and no error is raised.
     */
    firstName?: string
    /**
     * The user's last name. If not already hashed, the system will hash it before use. Zip Code, First Name, Last Name and Country Code must all be provided together. If any of them is missing, none of them are sent, and no error is raised.
     */
    lastName?: string
    /**
     * The user's country code. Zip Code, First Name, Last Name and Country Code must all be provided together. If any of them is missing, none of them are sent, and no error is raised.
     */
    countryCode?: string
  }
  /**
   * A mobile device ID defining a Customer Match audience member. A single value, or several separated by commas. This field is only used when syncing to a Customer Match Mobile Device ID audience. It is ignored when syncing to a Contact Info audience.
   */
  mobileDeviceIds?: string
  /**
   * Consent signals for this audience sync. A signal left unset is sent as not specified. Events with consent denied are not sent, as Display & Video 360 rejects any request containing denied consent.
   */
  consent?: {
    /**
     * Consent to use the data for advertising purposes.
     */
    adUserData?: string
    /**
     * Consent to use the data for ad personalization.
     */
    adPersonalization?: string
  }
  /**
   * The ID of the DV360 Audience.
   */
  external_id?: string
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
