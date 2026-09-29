// Generated file. DO NOT MODIFY IT BY HAND.

export interface Settings {
  /**
   * Avo Inspector API Key can be found in the Inspector setup page on your source in Avo.
   */
  apiKey: string
  /**
   * Optional. Enables verification of the property values against your Tracking Plan (e.g. allowed values, min/max constraints). Values are end-to-end encrypted and Avo can not decrypt them. Read more: https://www.avo.app/docs/inspector/connect-inspector-to-segment#property-value-validation-optional
   */
  publicEncryptionKey?: string
  /**
   * Avo Inspector Environment
   */
  env: string
  /**
   * If you send a custom event property on all events that contains the app version, please enter the name of that property here (e.g. “app_version”). If you do not have a custom event property for the app version, please leave this field empty.
   */
  appVersionPropertyName?: string
  /**
   * Sends events to Avo Inspector's current endpoint, which supports Avo gateways and the Output Reference, Origin Hint and Origin App Version fields. On by default for new destinations. Destinations added before this option existed keep using the previous endpoint until you turn it on.
   */
  gatewaySupport?: boolean
}
