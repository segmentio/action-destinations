// Generated file. DO NOT MODIFY IT BY HAND.

export interface Settings {
  /**
   * Your Moengage Workspace ID.
   */
  app_id: string
  /**
   * The environment for your Moengage account.
   */
  env: string
  /**
   * The datacenter for your Moengage account.
   */
  moeDataCenter: string
  /**
   * Your Moengage Project ID.
   */
  project_id?: string
  /**
   * The path to the service worker file for MoEngage web push notifications. if provided here, you need to host this file on your server.
   */
  swPath?: string
  /**
   * Enable Single Page Application (SPA) support in the Moengage SDK. Enable this if your website is a single page application to ensure proper tracking.
   */
  enableSPA?: boolean
  /**
   * Disable Moengage from showing Onsite Messaging on your website.
   */
  disable_onsite?: boolean
  /**
   * A custom domain name where the MoEngage web SDK is hosted. Data will be sent to this domain.
   */
  customProxyDomain?: string
  /**
   * A comma delimited list of bot user agents to ignore when tracking events.
   */
  bots_list?: string
  /**
   * Disable Moengage from setting cookies on your website when the page loads.
   */
  disableCookies?: boolean
  /**
   * Disable the Moengage SDK from initializing on your website when the page loads. You can use this to conditionally load the SDK based on user consent.
   */
  disableSdk?: boolean

  cards_enabled: boolean
  /**
   * The CSS selector for the MoEngage Inbox icon on your website. The user will click this icon to open the inbox.
   */
  css_selector_inbox_icon?: string
  /**
   * Enable the floating bell icon for MoEngage notifications on desktop devices.
   */
  floating_bell_icon_desktop?: boolean
  /**
   * Enable the floating bell icon for MoEngage notifications on mobile devices.
   */
  floating_bell_icon_mobile?: boolean
}
