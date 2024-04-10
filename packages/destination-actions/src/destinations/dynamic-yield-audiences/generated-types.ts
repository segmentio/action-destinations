// Generated file. DO NOT MODIFY IT BY HAND.

export interface Settings {
  /**
   * Dynamic Yield Section ID
   */
  sectionId: string
  /**
   * Dynamic Yield Data Center
   */
  dataCenter: string
  /**
   * Description to be added
   */
  accessKey: string
  /**
   * The type of identifier being used to identify the user in Dynamic Yield. Segment hashes the identifier before sending to Dynamic Yield.
   */
  identifier_type: string
}
// Generated file. DO NOT MODIFY IT BY HAND.

export interface AudienceSettings {
  /**
   * Provide a name for your Audience which will display in Dynamic Yield. If left empty Segment will send the snake_cased Engage Audience name.
   */
  audience_name: string
  /**
   * Required: Provide a random unique ID for your Audience which will display in Dynamic Yield.
   */
  audience_id: string
}
