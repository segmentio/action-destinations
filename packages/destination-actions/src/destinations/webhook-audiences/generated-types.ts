// Generated file. DO NOT MODIFY IT BY HAND.

export interface Settings {
  /**
   * If set, Segment will sign requests with an HMAC in the signature request header. The HMAC is a hex-encoded SHA1 hash generated using this shared secret and the entire request body. See "Use X-Segment-Signature Header" for the header name used.
   */
  sharedSecret?: string
  /**
   * When enabled, the HMAC signature is sent in the "X-Segment-Signature" request header instead of "X-Signature". Only applies when a Shared Secret is set. Disabled by default.
   */
  useSegmentSignatureHeader?: boolean
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
   * Extra JSON fields to pass on to every request. This must be a valid JSON string (e.g., "{\"hello\": \"world\", \"foo\": \"bar\"}"). The JSON will be parsed and merged into each request payload. Note: "externalId" and "audienceName" are reserved keys and cannot be used.
   */
  extras?: string
}
