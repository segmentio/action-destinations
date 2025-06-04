// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The ID of the Braze campaign to trigger. The campaign must be an API-triggered campaign created in Braze.
   */
  campaign_id: string
  /**
   * Optional string to identify the send. This can be used for send level analytics, or to cancel a send.
   */
  send_id?: string
  /**
   * Optional data that will be used to personalize the campaign message. Personalization key-value pairs that will apply to all users in this request.
   */
  trigger_properties?: {
    [k: string]: unknown
  }
  /**
   * Must be set to true when sending a message to an entire segment that a campaign targets. Only one of "broadcast", "recipients" or "audience" should be provided.
   */
  broadcast?: boolean
  /**
   * Attachments to send along with the campaign. Limited to 2MB per file.
   */
  attachments?: {
    /**
     * The name of the file to be attached.
     */
    file_name: string
    /**
     * The URL of the file to be attached.
     */
    url: string
  }[]
  /**
   * An array of user identifiers to send the campaign to. Only one of "recipients", "broadcast" or "audience" should be provided.
   */
  recipients?: {
    /**
     * External identifier of user to receive message.
     */
    external_user_id?: string
    /**
     * User alias object to identify the user.
     */
    user_alias?: {
      [k: string]: unknown
    }
    /**
     * Email address of user to receive message.
     */
    email?: string
    /**
     * Properties that will override the default trigger_properties for a specific user.
     */
    trigger_properties?: {
      [k: string]: unknown
    }
    /**
     * Defaults to true, can't be used with user aliases; if set to false, an attributes object must also be included.
     */
    send_to_existing_only?: boolean
    /**
     * Fields in the attributes object will create or update an attribute of that name with the given value on the specified user profile before the message is sent and existing values will be overwritten.
     */
    attributes?: {
      [k: string]: unknown
    }
  }[]
  /**
   * Prioritization settings; required when using email. This prioritization will be applied to all recipients.
   */
  prioritization?: {
    /**
     * First priority in the prioritization sequence
     */
    first_priority?: string
    /**
     * Second priority in the prioritization sequence
     */
    second_priority?: string
  }
  /**
   * A standard audience object to specify the users to send the campaign to. Only one of "recipients", "broadcast" or "audience" should be provided.
   */
  audience?: {
    [k: string]: unknown
  }
}
