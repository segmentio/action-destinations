// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Name of thew view or page.
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
}
