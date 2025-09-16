// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * User's email (ex: foo@bar.com)
   */
  email: string
  /**
   * The name of the audience to which you want to add users.
   */
  audience_name: string
  /**
   * The ID of the audience to which you want to add users.
   */
  audience_id: string
  /**
   * A computed object for track and identify events. This field should not need to be edited.
   */
  traits_or_props: {
    [k: string]: unknown
  }
  /**
   * Additional user profile details to send to Vibe. This information is used to improve the match rate.
   */
  personal_information?: {
    /**
     * User's first name
     */
    first_name?: string
    /**
     * User's last name
     */
    last_name?: string
    /**
     * User's phone number
     */
    phone?: string
  }
  /**
   * Enable batching of requests.
   */
  enable_batching: boolean
  /**
   * Maximum number of events to include in each batch. Actual batch sizes may be lower.
   */
  batch_size: number
  /**
   * The keys to use for batching the events.
   */
  batch_keys?: string[]
}
