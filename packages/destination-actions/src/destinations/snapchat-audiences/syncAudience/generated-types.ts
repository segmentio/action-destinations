// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Unique Audience Identifier returned by the createAudience() function call.
   */
  external_audience_id: string
  /**
   * Choose the type of identifier to use when adding users to Snapchat. If selecting Mobile ID or Phone, ensure these identifiers are included as custom traits in the Audience settings page where the destination is connected.
   */
  schema_type: string
  /**
   * User's phone number
   */
  phone?: string
  /**
   * User's email address
   */
  email?: string
  /**
   * Select the type of mobile identifier to use as External ID
   */
  mobile_id_type: string
  /**
   * User's mobile advertising ID. Ensure you have included either 'ios.idfa' or 'android.idfa' as identifiers in the 'Customized Setup' menu when connecting the destination to your audience.
   */
  advertising_id?: string
  /**
   * User's mobile device ID. Ensure you have included either 'ios.id' or 'android.id' as identifiers in the 'Customized Setup' menu when connecting the destination to your audience.
   */
  mobile_device_id?: string
}
