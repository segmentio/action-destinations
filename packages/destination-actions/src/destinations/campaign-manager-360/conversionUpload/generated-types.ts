// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The Google Click ID (gclid) associated with the conversion.
   */
  gclid?: string
  /**
   * The Display Click ID (dclid) associated with the conversion.
   */
  dclid?: string
  /**
   * The Floodlight configuration ID associated with the conversion.
   */
  floodlightConfigurationId?: string
  /**
   * The Floodlight activity ID associated with the conversion.
   */
  floodlightActivityId?: string
  /**
   * The ordinal value of the conversion.
   */
  ordinal?: number
  /**
   * The quantity of the conversion.
   */
  quantity?: number
  /**
   * The timestamp of the conversion in microseconds.
   */
  timestampMicros?: number
  /**
   * The value of the conversion.
   */
  value?: number
  /**
   * Custom variables associated with the conversion.
   */
  customVariables?: {
    [k: string]: unknown
  }
}
