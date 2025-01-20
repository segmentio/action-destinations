// Generated file. DO NOT MODIFY IT BY HAND.

export interface Settings {
  /**
   * The app ID of the environment to which you want to send data. You can find this ID on the [Projects](https://heapanalytics.com/app/manage/projects) page.
   */
  appId: string
  /**
   * Setting to true will redact all target text on your website. For more information visit the Heap [docs page](https://developers.heap.io/docs/web#global-data-redaction-via-disabling-text-capture).
   */
  disableTextCapture?: boolean
  /**
   * This option is turned off by default to accommodate websites not served over HTTPS. If your application uses HTTPS, we recommend enabling secure cookies to prevent Heap cookies from being observed by unauthorized parties. For more information visit the Heap [docs page](https://developers.heap.io/docs/web#securecookie).
   */
  secureCookie?: boolean
  /**
   * This is an optional setting. This is used to set up first-party data collection. For most cased this should not be set. For more information visit the Heap [docs page](https://developers.heap.io/docs/set-up-first-party-data-collection-in-heap). This field is deprecated in favor of `ingestServer`. If `trackingServer` is set and `ingestServer` is not set, then the Classic SDK will be loaded. If both are set, `ingestServer` will take precedence, and the latest stable version of the Heap SDK will be loaded.
   */
  trackingServer?: string
  /**
   * This is an optional setting. This is used to set up first-party data collection. For most cased this should not be set. For more information visit the Heap [docs page](https://developers.heap.io/docs/web#ingestserver).
   */
  ingestServer?: string
  /**
   * This is an optional setting used to set the host that loads the Heap SDK. This setting is used when the Heap SDK is self-hosted. In most cased this should be left unset. The hostname should not contain https or app id. When _both_ `hostname` and `trackingServer` are set, the Classic SDK will be loaded via: `https://${hostname}/js/heap-${appId}.js`. If `hostname` is set and `trackingServer` is not set, then the latest version of the Heap SDK will be loaded via: `https://${settings.hostname}/config/${settings.appId}/heap_config.js`. For more information visit the Heap [docs page](https://developers.heap.io/docs/self-hosting-heapjs).
   */
  hostname?: string
  /**
   * This is an optional setting. When set, nested array items will be sent in as new Heap events. Defaults to 0.
   */
  browserArrayLimit?: number
}
