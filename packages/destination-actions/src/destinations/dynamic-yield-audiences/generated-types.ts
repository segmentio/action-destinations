// Generated file. DO NOT MODIFY IT BY HAND.

export interface Settings {
  /**
   * Dynamic Yield by Mastercard Section ID
   */
  sectionId: string
  /**
   * Description to be added
   */
  accessKey: string
}
// Generated file. DO NOT MODIFY IT BY HAND.

export interface AudienceSettings {
  /**
   * Provide a name for your Audience to be displayed in Dynamic Yield by Mastercard.
   */
  audience_name: string
  /**
   * The Segment identifier to send to Dynamic Yield by Mastercard. E.g. `email`, `anonymousId`, `userId` or any other custom identifier. Make sure to configure the identifier in the `Customized Setup` below so that it is sent to Dynamic Yield by Mastercard.
   */
  identifier_type: string
  /**
   * The name of the identifier in Dynamic Yield by Mastercard. You can leave this field empty if the Segment identifier name is the same as the Dynamic Yield by Mastercard identifier name.
   */
  dy_identifier_type?: string
}
