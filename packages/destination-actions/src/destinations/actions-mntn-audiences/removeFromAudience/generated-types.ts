// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The ID of the MNTN audience segment to remove this user from. Automatically populated from the audience setup — do not change unless you need to override it.
   */
  segment_id: string
  /**
   * The ID used to identify this user in MNTN. Must be consistent with the value used during the Add to Audience call. Defaults to userId, falling back to anonymousId.
   */
  identity_id: string
}
