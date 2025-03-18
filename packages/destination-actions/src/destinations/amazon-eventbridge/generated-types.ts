// Generated file. DO NOT MODIFY IT BY HAND.

export interface Settings {
  /**
   * The AWS Account ID that the event bus belongs to.
   *                       This is used to generate the ARN for the event bus.
   */
  awsAccountId: string
  /**
   * The AWS region that the event bus belongs to.
   */
  awsRegion: string
  /**
   * The name of the partner event source to use for the event bus.
   */
  partnerEventSourceName: string
  /**
   * If enabled, Segment will check whether Partner Source identified by Segment source ID
   *                       exists in EventBridge.
   *                       If Partner Source does not exist, Segment will create a new Partner Source.
   */
  createPartnerEventSource?: boolean
}
