// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * A UUID (unique user ID) specified by you. **Note:** If you send a request with a user ID that is not in the Amplitude system yet, then the user tied to that ID will not be marked new until their first event. If either user ID or device ID is present, an associate user to group call will be made.
   */
  user_id?: string | null
  /**
   * The timestamp of the event. If time is not sent with the event, it will be set to the request upload time.
   */
  time?: string | number
  /**
   * Amplitude will deduplicate subsequent events sent with this ID we have already seen before within the past 7 days. Amplitude recommends generating a UUID or using some combination of device ID, user ID, event type, event ID, and time.
   */
  insert_id?: string
  /**
   * A device-specific identifier, such as the Identifier for Vendor on iOS. Required unless user ID is present. If a device ID is not sent with the event, it will be set to a hashed version of the user ID.
   */
  device_id?: string
  /**
   * Additional data tied to the group in Amplitude.
   */
  group_properties?: {
    [k: string]: unknown
  }
  /**
   * The type of the group
   */
  group_type: string
  /**
   * The value of the group
   */
  group_value: string
}
