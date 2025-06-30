// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The ID of the canvas to trigger. The canvas must be API-triggered and the status must be "Draft" or "Active".
   */
  canvas_id: string
  /**
   * Optional data that will be used to personalize the canvas message. Personalization key-value pairs that will apply to all users in this request.
   */
  canvas_entry_properties?: {
    [k: string]: unknown
  }
  /**
   * If set to true, the canvas will be sent to all the users in the segment targeted by the canvas. It cannot be used with "recipients".
   */
  broadcast?: boolean
  /**
   * An array of user identifiers to send the canvas to. It cannot be used with "broadcast".
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
      /**
       * The name of the alias
       */
      alias_name?: string
      /**
       * The label of the alias
       */
      alias_label?: string
    }
    /**
     * Email address of user to receive message.
     */
    email?: string
    /**
     * Properties that will override the default canvas_entry_properties for a specific user.
     */
    canvas_entry_properties?: {
      [k: string]: unknown
    }
    /**
     * Defaults to true, cannot be used with user aliases; if set to false, an attributes object must also be included.
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
   * Prioritization settings; required when using email in recipients. This prioritization will be applied to all recipients.
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
   * A standard audience object to specify the users to send the canvas to. Including "audience" will only send to users in the audience
   */
  audience?: {
    [k: string]: unknown
  }
}
