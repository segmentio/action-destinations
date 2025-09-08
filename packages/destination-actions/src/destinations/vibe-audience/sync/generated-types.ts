// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * User's email (ex: foo@bar.com)
   */
  email: string
  /**
   * The ID representing the Vibe audience identifier. This is the identifier that is returned during audience creation.
   */
  external_audience_id?: string
  /**
   * Enable batching of requests.
   */
  enable_batching: boolean
  /**
   * Maximum number of events to include in each batch. Actual batch sizes may be lower.
   */
  batch_size: number
}
// Generated file. DO NOT MODIFY IT BY HAND.

export interface RetlOnMappingSaveInputs {
  /**
   * Choose to either create a new audience or use an existing one. If you opt to create a new audience, we will display the required fields for audience creation. If you opt to use an existing audience, a drop-down menu will appear, allowing you to select from all the audiences in your advertiser account.
   */
  operation?: string
  /**
   * The name of the audience in Vibe.
   */
  audienceName?: string
  /**
   * The ID of the audience in Vibe.
   */
  existingAudienceId?: string
}
// Generated file. DO NOT MODIFY IT BY HAND.

export interface RetlOnMappingSaveOutputs {
  /**
   * The name of the audience in Vibe this mapping is connected to.
   */
  audienceName: string
  /**
   * The ID of the audience in Vibe.
   */
  audienceId: string
}
