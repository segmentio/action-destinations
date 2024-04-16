// Generated file. DO NOT MODIFY IT BY HAND.

export interface Settings {
  /**
   * If set, Segment will sign requests with an HMAC in the "X-Signature" request header. The HMAC is a hex-encoded SHA1 hash generated using this shared secret and the request body.
   */
  sharedSecret?: string
  /**
   * If set, Segment will send a POST request with the audienceName in the JSON to the provided URL to create the audience. The expected JSON response must have "externalId".
   */
  createAudienceUrl?: string
  /**
   * If set, Segment will send a POST request with the externalId in the JSON to the provided URL to get the audience. The expected JSON response must have "externalId".
   */
  getAudienceUrl?: string
}
// Generated file. DO NOT MODIFY IT BY HAND.

export interface AudienceSettings {
  /**
   * Extra json fields to pass on to every request. Note: "externalId" and "audienceName" are reserved.
   */
  extras?: string
}
