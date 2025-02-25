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
   * USE WITH CAUTION: This will create the partner event source if it does not already exist.
   *                       Use this option if you want to create the partner event source.
   *                       projectId or context.protocols.sourceId will be used as the sourceId to
   *                       create the partner event source.
   *                       Use with caution.
   */
  createPartnerEventSource?: boolean
}
