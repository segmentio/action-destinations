// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * A UUID (unique user ID) specified by you. **Note:** If you send a request with a user ID that is not in the Amplitude system yet, then the user tied to that ID will not be marked new until their first event. Required unless device ID is present.
   */
  user_id?: string | null
  /**
   * A device specific identifier, such as the Identifier for Vendor (IDFV) on iOS. Required unless user ID is present.
   */
  device_id?: string
  /**
   * Additional data tied to the user in Amplitude. Each distinct value will show up as a user segment on the Amplitude dashboard. Object depth may not exceed 40 layers. **Note:** You can store property values in an array and date values are transformed into string values.
   */
  user_properties?: {
    [k: string]: unknown
  }
  /**
   * Groups of users for Amplitude's account-level reporting feature. Note: You can only track up to 5 groups. Any groups past that threshold will not be tracked. **Note:** This feature is only available to Amplitude Enterprise customers who have purchased the Amplitude Accounts add-on.
   */
  groups?: {
    [k: string]: unknown
  }
  /**
   * Version of the app the user is on.
   */
  app_version?: string
  /**
   * What platform is sending the data.
   */
  platform?: string
  /**
   * Mobile operating system or browser the user is on.
   */
  os_name?: string
  /**
   * Version of the mobile operating system or browser the user is on.
   */
  os_version?: string
  /**
   * Device brand the user is on.
   */
  device_brand?: string
  /**
   * Device manufacturer the user is on.
   */
  device_manufacturer?: string
  /**
   * Device model the user is on.
   */
  device_model?: string
  /**
   * Carrier the user has.
   */
  carrier?: string
  /**
   * Country the user is in.
   */
  country?: string
  /**
   * Geographical region the user is in.
   */
  region?: string
  /**
   * What city the user is in.
   */
  city?: string
  /**
   * The Designated Market Area of the user.
   */
  dma?: string
  /**
   * Language the user has set.
   */
  language?: string
  /**
   * Whether the user is paying or not.
   */
  paying?: boolean
  /**
   * Version of the app the user was first on.
   */
  start_version?: string
  /**
   * Amplitude will deduplicate subsequent events sent with this ID we have already seen before within the past 7 days. Amplitude recommends generating a UUID or using some combination of device ID, user ID, event type, event ID, and time.
   */
  insert_id?: string
}
