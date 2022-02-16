// Generated file. DO NOT MODIFY IT BY HAND.

export interface Settings {
  /**
   * The app ID of the environment to which you want to send data. You can find this ID on the [Projects](https://heapanalytics.com/app/manage/projects) page.
   */
  appId: string
  /**
   * Setting to true will redact all target text on your website. For more information visit the heap [docs page](https://developers.heap.io/docs/web#global-data-redaction-via-disabling-text-capture).
   */
  disableTextCapture?: boolean
  /**
   * This option is turned off by default to accommodate websites not served over HTTPS. If your application uses HTTPS, we recommend enabling secure cookies to prevent Heap cookies from being observed by unauthorized parties. For more information visit the heap [docs page](https://developers.heap.io/docs/web#securecookie).
   */
  secureCookie?: boolean
}
