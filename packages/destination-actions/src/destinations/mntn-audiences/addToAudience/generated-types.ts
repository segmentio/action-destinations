// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The ID of the MNTN audience segment to add this user to. Automatically populated from the audience setup — do not change unless you need to override it.
   */
  segment_id: string
  /**
   * A stable identifier for this user within MNTN, used to uniquely represent their segment membership. Must be consistent between add and remove operations. Defaults to userId, falling back to anonymousId.
   */
  identity_id: string
  /**
   * The user's email address. Sent to MNTN in plaintext and as a SHA-256 hash — both are 1st-class identifiers for audience matching.
   */
  email?: string
  /**
   * The user's phone number in E.164 format (e.g. +15556004638). Sent to MNTN in plaintext and as a SHA-256 hash — both are 1st-class identifiers for audience matching.
   */
  phone?: string
  /**
   * The user's IPv4 address at the time of the event. Used for probabilistic audience matching in MNTN campaigns.
   */
  ip?: string
  /**
   * The user's Mobile Advertising ID — IDFA on iOS or GAID on Android. Used for mobile audience matching.
   */
  maid?: string
  /**
   * ISO 8601 timestamp of when this audience membership event occurred. Sent to MNTN as `source_time`.
   */
  timestamp?: string
}
