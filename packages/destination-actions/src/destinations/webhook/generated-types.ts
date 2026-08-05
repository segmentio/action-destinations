// Generated file. DO NOT MODIFY IT BY HAND.

export interface Settings {
  /**
   * If set, Segment will sign requests with an HMAC in the "X-Signature" request header. The HMAC is a hex-encoded SHA1 hash generated using this shared secret and the request body.
   */
  sharedSecret?: string
  /**
   * If set, Segment will also sign requests with an HMAC in the "X-Secondary-Signature" request header. The HMAC is a hex-encoded SHA1 hash generated using this secondary secret and the request body.
   */
  secondarySecret: string
}
