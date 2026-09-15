// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The ID of the MNTN audience segment to sync to. Customers should not need to edit this field.
   */
  segment_id: string
  /**
   * A stable identifier for this user in MNTN. Defaults to userId, falling back to anonymousId.
   */
  identity_id: string
  /**
   * The user's email address. Sent to MNTN in plaintext and as a SHA-256 hash for audience matching.
   */
  email?: string
  /**
   * The user's phone number. Non-numeric characters (including the + prefix) are removed. Sent to MNTN in normalized plaintext and as a SHA-256 hash for audience matching.
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
