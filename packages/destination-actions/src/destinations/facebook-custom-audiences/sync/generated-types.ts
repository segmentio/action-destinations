// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Your company’s custom identifier for this user. This can be any unique ID, such as loyalty membership IDs, user IDs, and external cookie IDs.
   */
  externalId: string
  /**
   * User’s email (ex: foo@bar.com)
   */
  email?: string
  /**
   * User’s phone number, including country code. Punctuation and spaces are ok (ex: 1-234-567-8910 or +44 844 412 4653)
   */
  phone?: string
  /**
   * User’s country. Use 2-letter country codes in ISO 3166-1 alpha-2 format.
   */
  country?: string
  /**
   * User’s date of birth. Include as many fields as possible for better match rates (ex: year = YYYY, month = MM, day = DD)
   */
  birth?: {
    year?: string
    month?: string
    day?: string
  }
  /**
   * User’s name. Include as many fields as possible for better match rates. Use a-z only. No punctuation. Special characters in UTF-8 format
   */
  name?: {
    first?: string
    last?: string
    firstInitial?: string
  }
  /**
   * User’s city. Use a-z only. No punctuation. No special characters.
   */
  city?: string
  /**
   * User’s state. Use the 2-character ANSI abbreviation code, Normalize states outside the US with no punctuation and no special characters.
   */
  state?: string
  /**
   * User’s postal code. For the US, use only the first 5 digits. For the UK, use the Area/District/Sector format.
   */
  zip?: string
  /**
   * User’s gender (m for male, f for female)
   */
  gender?: string
  /**
   * User’s Apple IDFA, Android Ad ID, or Facebook app scoped ID. Keep hyphens (ex: AB1234CD-E123-12FG-J123)
   */
  mobileAdId?: string
  /**
   * The app ID of the user.
   */
  appId?: string
  /**
   * The page ID of the user.
   */
  pageId?: string
  /**
   * The ID representing the Facebook identifier. This is the identifier that is returned during audience creation.'
   */
  external_audience_id?: string
  /**
   * Enable batching of requests.
   */
  enable_batching: boolean
  /**
   * Maximum number of events to include in each batch. Actual batch sizes may be lower.
   */
  batch_size: number
}
// Generated file. DO NOT MODIFY IT BY HAND.

export interface RetlOnMappingSaveInputs {
  /**
   * Choose to either create a new custom audience or use an existing one. If you opt to create a new audience, we will display the required fields for audience creation. If you opt to use an existing audience, a drop-down menu will appear, allowing you to select from all the custom audiences in your ad account.
   */
  operation?: string
  /**
   * The name of the audience in Facebook.
   */
  audienceName?: string
  /**
   * The ID of the audience in Facebook.
   */
  existingAudienceId?: string
}
// Generated file. DO NOT MODIFY IT BY HAND.

export interface RetlOnMappingSaveOutputs {
  /**
   * The name of the audience in Facebook this mapping is connected to.
   */
  audienceName: string
  /**
   * The ID of the audience in Facebook.
   */
  audienceId: string
}
