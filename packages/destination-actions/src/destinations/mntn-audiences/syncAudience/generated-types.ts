// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The ID of the MNTN audience segment to sync this user into or out of. Automatically populated from the audience setup — do not change unless overriding.
   */
  segment_id: string
  /**
   * The Segment Engage computation key for this audience. Used to read the membership boolean from the event traits or properties to determine add vs. remove.
   */
  audience_key: string
  /**
   * The traits (identify events) or properties (track events) object from the Engage event. The membership boolean for this audience is read from this object using the Audience Key.
   */
  traits_or_properties: {
    [k: string]: unknown
  }
  /**
   * A stable identifier for this user in MNTN. Must be consistent between add and remove operations for the same user. Defaults to userId, falling back to anonymousId.
   */
  identity_id: string
  /**
   * The user's email address. Sent to MNTN in plaintext and as a SHA-256 hash for audience matching.
   */
  email?: string
  /**
   * The user's phone number. All non-numeric characters (including the + prefix) are stripped before sending and hashing per MNTN API spec. Sent in normalized form and as a SHA-256 hash.
   */
  phone?: string
  /**
   * The user's IPv4 address. Used for probabilistic audience matching in MNTN campaigns.
   */
  ip?: string
  /**
   * The user's Mobile Advertising ID — IDFA on iOS or GAID on Android.
   */
  maid?: string
  /**
   * ISO 8601 timestamp of when this audience membership event occurred. Sent to MNTN as source_time.
   */
  timestamp?: string
}
