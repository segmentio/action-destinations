export interface Settings {
  sdkVersion: string
  api_key: string
  endpoint: string
  allowCrawlerActivity?: boolean
  allowUserSuppliedJavascript?: boolean
  appVersion?: string
  contentSecurityNonce?: string
  devicePropertyAllowlist?: string[]
  disablePushTokenMaintenance?: boolean
  doNotLoadFontAwesome?: boolean
  enableLogging?: boolean
  enableSdkAuthentication?: boolean
  inAppMessageZIndex?: number
  localization?: string
  automaticallyDisplayMessages?: boolean
  manageServiceWorkerExternally?: boolean
  minimumIntervalBetweenTriggerActionsInSeconds?: number
  noCookies?: boolean
  openCardsInNewTab?: boolean
  openInAppMessagesInNewTab?: boolean
  requireExplicitInAppMessageDismissal?: boolean
  safariWebsitePushId?: string
  serviceWorkerLocation?: string
  sessionTimeoutInSeconds?: number
}
