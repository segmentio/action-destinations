// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The type of the event being performed.
   */
  type: string
  /**
   * The unique user identifier set by you
   */
  user_id?: string | null
  /**
   * The generated anonymous ID for the user
   */
  anonymous_id?: string | null
  /**
   * Properties to set on the user profile
   */
   app_version?: string
   /**
    * The name of the mobile operating system or browser that the user is using.
    */
   os_name?: string
   /**
   * The version of the SDK used to send events
   */
   library_version?: string
   /**
   * An object of key-value pairs that represent event properties to be sent along with the event.
   */
  traits?: {
    [k: string]: unknown
  }
  /**
  * The timestamp of the event. If time is not sent with the event, it will be set to the time our servers receive it.
  */
   timestamp?: string
}
