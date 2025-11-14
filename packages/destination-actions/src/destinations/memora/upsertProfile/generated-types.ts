// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Contact information object containing email, firstName, lastName, and phone fields that will be placed in the Contact trait group in the Memora API call.
   */
  contact?: {
    [k: string]: unknown
  }
  /**
   * Additional traits to include in the Memora profile, organized by trait group. Keys should match trait group names and values should be objects of traits for that group.
   */
  otherTraits?: {
    [k: string]: unknown
  }
}
