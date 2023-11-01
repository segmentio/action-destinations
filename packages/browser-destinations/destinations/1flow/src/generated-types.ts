export interface Settings {
  /**
   * The app_id of your 1Flow app which will indicate where to store any data.
   */
  projectApiKey: string

  appId: string
  /**
   * By default, 1Flow will inject their own inbox button onto the page, but you can choose to use your own custom button instead by providing a CSS selector, e.g. #my-button. You must have the "Show the 1Flow Inbox" setting enabled for this to work. The default value is #1FlowDefaultWidget.
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
  apiToken: string
}
