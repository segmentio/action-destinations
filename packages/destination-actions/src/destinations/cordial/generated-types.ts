// Generated file. DO NOT MODIFY IT BY HAND.

export interface Settings {
  /**
   * Your Cordial API Key
   */
  apiKey: string
  /**
   * Cordial API endpoint. Leave default, unless you've been provided with another one. [See more details](https://support.cordial.com/hc/en-us/sections/200553578-REST-API-Introduction-and-Overview)
   */
  endpoint: string
  /**
   * Cordial attribute key to store Segment User ID in (e.g. `segment_id`)
   */
  segmentIdKey?: string
  /**
   * Cordial attribute key to store Segment Anonymous ID in (e.g. `segment_anonymous_id`)
   */
  anonymousIdKey?: string
}
