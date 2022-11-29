// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The type of the event being performed.
   */
  type: string
  /**
   * The name of the event being performed.
   */
  event: string
  /**
   * The unique identifier of the user.
   */
  userId?: string
  /**
   * The unique identifier of the anonymous user.
   */
  anonymousId?: string
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
   * An object of key-value pairs that represent event properties to be sent along with the event.
   */
  properties?: {
    [k: string]: unknown
  }
}
