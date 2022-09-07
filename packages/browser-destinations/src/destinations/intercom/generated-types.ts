// Generated file. DO NOT MODIFY IT BY HAND.

export interface Settings {
  /**
   * The app_id of your Intercom app which will indicate where to store any data.
   */
  appId: string
  /**
   * By default, Intercom will inject their own inbox button onto the page, but you can choose to use your own custom button instead by providing a CSS selector, e.g. #my-button. You must have the "Show the Intercom Inbox" setting enabled for this to work. The default value is #IntercomDefaultWidget.
   */
  activator?: string
  /**
   * A list of rich link property keys.
   */
  richLinkProperties?: string[]
  /**
   * The regional API to use for processing the data
   */
  apiBase?: string
}
