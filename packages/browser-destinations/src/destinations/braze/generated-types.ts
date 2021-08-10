// Generated file. DO NOT MODIFY IT BY HAND.

export interface Settings {
  /**
   * Created under Developer Console in the Braze Dashboard.
   */
  api_key: string
  /**
   * Your Braze SDK endpoint. [See more details](https://www.braze.com/docs/api/basics/#endpoints).
   */
  endpoint: string
  /**
   * Allow Braze to log activity from crawlers. [See more details](https://js.appboycdn.com/web-sdk/latest/doc/modules/appboy.html#initializationoptions)
   */
  allowCrawlerActivity?: boolean
  /**
   * To indicate that you trust the Braze dashboard users to write non-malicious Javascript click actions, set this property to true. If enableHtmlInAppMessages is true, this option will also be set to true. [See more details](https://js.appboycdn.com/web-sdk/latest/doc/modules/appboy.html#initializationoptions)
   */
  allowUserSuppliedJavascript?: boolean
  /**
   * Version to which user events sent to Braze will be associated with. [See more details](https://js.appboycdn.com/web-sdk/latest/doc/modules/appboy.html#initializationoptions)
   */
  appVersion?: string
  /**
   * Allows Braze to add the nonce to any <script> and <style> elements created by the SDK. [See more details](https://js.appboycdn.com/web-sdk/latest/doc/modules/appboy.html#initializationoptions)
   */
  contentSecurityNonce?: string
  /**
   * By default, the Braze SDK automatically detects and collects all device properties in DeviceProperties. To override this behavior, provide an array of DeviceProperties. [See more details](https://js.appboycdn.com/web-sdk/latest/doc/modules/appboy.html#initializationoptions)
   */
  devicePropertyAllowlist?: string[]
  /**
   * This initialization option is deprecated in favor of devicePropertyAllowlist, which has the same functionality.
   */
  devicePropertyWhitelist?: string[]
  /**
   * By default, users who have already granted web push permission will sync their push token with the Braze backend automatically on new session to ensure deliverability. To disable this behavior, set this option to false
   */
  disablePushTokenMaintenance?: boolean
  /**
   * Braze automatically loads FontAwesome 4.7.0 from the FontAwesome CDN. To disable this behavior set this option to true.
   */
  doNotLoadFontAwesome?: boolean
  /**
   * Set this to true to indicate that you trust the Braze dashboard users to write non-malicious HTML in-app messages. If allowUserSuppliedJavascript is set to true, this option will also be set to true.
   */
  enableHtmlInAppMessages?: boolean
  /**
   * Set to true to enable logging by default
   */
  enableLogging?: boolean
  /**
   * Set to true to enable the SDK Authentication feature.
   */
  enableSdkAuthentication?: boolean
  /**
   * By default, the Braze SDK will show In-App Messages with a z-index of 1040 for the screen overlay, 1050 for the actual in-app message, and 1060 for the message's close button. Provide a value for this option to override these default z-indexes.
   */
  inAppMessageZIndex?: number
  /**
   * By default, any SDK-generated user-visible messages will be displayed in the user's browser language. Provide a value for this option to override that behavior and force a specific language. The value for this option should be a ISO 639-1 Language Code.
   */
  localization?: string
  /**
   * If you have your own service worker that you register and control the lifecycle of, set this option to true and the Braze SDK will not register or unregister a service worker. [See more details](https://js.appboycdn.com/web-sdk/latest/doc/modules/appboy.html#initializationoptions)
   */
  manageServiceWorkerExternally?: boolean
  /**
   * Provide a value to override the default interval between trigger actions with a value of your own. [See more details](https://js.appboycdn.com/web-sdk/latest/doc/modules/appboy.html#initializationoptions)
   */
  minimumIntervalBetweenTriggerActionsInSeconds?: number
  /**
   * By default, the Braze SDK will store small amounts of data (user ids, session ids), in cookies. Pass true for this option to disable cookie storage and rely entirely on HTML 5 localStorage to identify users and sessions. [See more details](https://js.appboycdn.com/web-sdk/latest/doc/modules/appboy.html#initializationoptions)
   */
  noCookies?: boolean
  /**
   * By default, links from Card objects load in the current tab or window. Set this option to true to make links from cards open in a new tab or window.
   */
  openCardsInNewTab?: boolean
  /**
   * By default, links from in-app message clicks load in the current tab or a new tab as specified in the dashboard on a message-by-message basis. Set this option to true to force all links from in-app message clicks open in a new tab or window.
   */
  openInAppMessagesInNewTab?: boolean
  /**
   * By default, when an in-app message is showing, pressing the escape button or a click on the greyed-out background of the page will dismiss the message. Set this option to true to prevent this behavior and require an explicit button click to dismiss messages.
   */
  requireExplicitInAppMessageDismissal?: boolean
  /**
   * If you support Safari push, you must specify this option with the website push ID that you provided to Apple when creating your Safari push certificate (starts with "web", e.g. "web.com.example.domain").
   */
  safariWebsitePushId?: string
  /**
   * By default, when registering users for web push notifications Braze will look for the required service worker file in the root directory of your web server at /service-worker.js. If you want to host your service worker at a different path on that server, provide a value for this option that is the absolute path to the file, e.g. /mycustompath/my-worker.js. VERY IMPORTANT: setting a value here limits the scope of push notifications on your site. For instance, in the above example, because the service  ,worker file is located within the /mycustompath/ directory, appboy.registerAppboyPushMessages MAY ONLY BE CALLED from web pages that start with http://yoursite.com/mycustompath/.
   */
  serviceWorkerLocation?: string
  /**
   * By default, sessions time out after 30 minutes of inactivity. Provide a value for this configuration option to override that default with a value of your own.
   */
  sessionTimeoutInSeconds?: number
}
