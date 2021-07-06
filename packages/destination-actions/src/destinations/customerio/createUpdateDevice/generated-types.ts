// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * ID of the person that this device belongs to.
   */
  person_id: string
  /**
   * Unique ID for this device.
   */
  device_id: string
  /**
   * The device platform.
   */
  platform: string
  /**
   * Timestamp for when the device was last used. Default is current date and time.
   */
  last_used?: string
}
