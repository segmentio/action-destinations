// Generated file. DO NOT MODIFY IT BY HAND.

export interface Settings {
  /**
   * Avo Inspector API Key can be found in the Inspector setup page on your source in Avo.
   */
  apiKey: string
  /**
   * Optional. Enables verification of the property values against your Tracking Plan (e.g. allowed values, regex patterns, min/max constraints). Values are end-to-end encrypted and Avo can not decrypt them. Read more: https://www.avo.app/docs/inspector/connect-inspector-to-segment#property-value-validation-optional
   */
  inspectorEncryptionKey?: string
  /**
   * Avo Inspector Environment
   */
  env: string
  /**
   * If you send a custom event property on all events that contains the app version, please enter the name of that property here (e.g. “app_version”). If you do not have a custom event property for the app version, please leave this field empty.
   */
  appVersionPropertyName?: string
}
