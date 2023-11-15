// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The type of the event being performed.
   */
  type: string
  /**
   * The unique user identifier set by you
   */
  userId?: string | null
  /**
   * Setting this to true will not create new users in MoEngage. Only existing users will be updated
   */
  update_existing_only?: boolean
  /**
   * The generated anonymous ID for the user
   */
  anonymousId?: string | null
  /**
   * The name of the mobile operating system or browser that the user is using.
   */
  os_name?: string
  /**
   * The version of the mobile operating system or browser the user is using.
   */
  app_version?: string
  /**
   * The version of the mobile operating system or browser the user is using.
   */
  library_version?: string
  /**
   * The timestamp of the event. If time is not sent with the event, it will be set to the time our servers receive it.
   */
  timestamp?: string | number
  /**
   * Properties to set on the user profile
   */
  traits?: {
    [k: string]: unknown
  }
}
