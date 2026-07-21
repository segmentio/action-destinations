// Generated file. DO NOT MODIFY IT BY HAND.

export interface Settings {
  /**
   * Eagle Eye URL of the Segment connector provided by your EagleEye CSM
   */
  connectorUrl: string
  /**
   * Key to authenticate with the connector provided by your EagleEye CSM
   */
  externalKey: string
}
// Generated file. DO NOT MODIFY IT BY HAND.

export interface AudienceSettings {
  /**
   * Required if connecting to an Engage Audience. Accepts a comma delimited list of reference strings for the Behavioral Action to be executed. E.g.: A0001,P0001
   */
  behavioralActionTriggerReferences?: string
}
