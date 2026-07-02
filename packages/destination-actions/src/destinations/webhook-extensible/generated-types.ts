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
}
