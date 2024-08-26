// Generated file. DO NOT MODIFY IT BY HAND.

export interface Settings {
  /**
   * If set, Segment will sign requests with an HMAC in the "X-Signature" request header. The HMAC is a hex-encoded SHA1 hash generated using this shared secret and the request body.
   */
  sharedSecret?: string
  /**
   * Your client ID.
   */
  client_id: string
  /**
   * Your client secret.
   */
  client_secret: string
  /**
   * The URL to authenticate the client.
   */
  authenticationUrl: string
  /**
   * The URL to refresh the access token.
   */
  refreshTokenUrl: string
}
