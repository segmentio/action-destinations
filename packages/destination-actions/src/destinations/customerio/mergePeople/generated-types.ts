// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The person that you want to remain after the merge, identified by id, email or cio_id. This person receives information from the secondary person in the merge.
   */
  primary: string
  /**
   * The person that you want to delete after the merge, identified by id, email or cio_id. This person's information is merged into the primary person's profile and then it is deleted.
   */
  secondary: string
}
