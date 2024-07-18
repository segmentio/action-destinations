// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Name of the view or page.
   */
  viewName: string
  /**
   * Parameters specific to the view or page.
   */
  pageParameters?: {
    [k: string]: unknown
  }
  /**
   * By default, notifications are sent to the Adobe Target backend for incrementing impression count.  If false, notifications are not sent for incrementing impression count.
   */
  sendNotification?: boolean
  /**
   * A user’s unique visitor ID. Setting an Mbox 3rd Party ID allows for updates via the Adobe Target Cloud Mode Destination. For more information, please see our Adobe Target Destination documentation.
   */
  userId?: string
}
