// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Property key by which Cordial contact should be identified. May be any primary or secondary key (e.g. cID, email, segment_id etc.)
   */
  identifyByKey: string
  /**
   * Value for defined key
   */
  identifyByValue: string
  /**
   * Contact Attributes
   */
  attributes?: {
    [k: string]: unknown
  }
}
