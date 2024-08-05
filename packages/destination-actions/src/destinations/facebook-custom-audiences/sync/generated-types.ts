// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The email address of the user.
   */
  email?: string
  /**
   * The phone number of the user.
   */
  phone?: string
  /**
   * The gender of the user.
   */
  gender?: string
  /**
   * The date of birth of the user.
   */
  birth?: {
    year?: string
    month?: string
    day?: string
  }
  /**
   * The name of the user.
   */
  name?: {
    first?: string
    last?: string
    firstInitial?: string
  }
  /**
   * The city of the user
   */
  city?: string
  /**
   * The state of the user.
   */
  state?: string
  /**
   * The postal code of the user.
   */
  zip?: string
  /**
   * The country of the user.
   */
  country?: string
  /**
   * The mobile advertising ID of the user.
   */
  mobileAdId?: string
  /**
   * The external ID of the user.
   */
  externalId?: string
  /**
   * The app IDs of the user.
   */
  appIds?: string[]
  /**
   * The page IDs of the user.
   */
  pageIds?: string[]
  /**
   * Enable batching of requests.
   */
  enable_batching: boolean
  /**
   * Maximum number of events to include in each batch. Actual batch sizes may be lower.
   */
  batch_size: number
}
// Generated bundle for hooks. DO NOT MODIFY IT BY HAND.

export interface HookBundle {
  retlOnMappingSave: {
    inputs?: {
      /**
       * Choose to either create a new custom audience or use an existing one. If you opt to create a new audience, we will display the required fields for audience creation. If you opt to use an existing audience, a drop-down menu will appear, allowing you to select from all the custom audiences in your ad account.
       */
      operation?: string
      /**
       * The name of the audience in Facebook.
       */
      audienceName?: string
      /**
       * The ID of the audience in Facebook.
       */
      existingAudienceId?: string
    }
    outputs?: {
      /**
       * The name of the audience in Facebook this mapping is connected to.
       */
      audienceName: string
      /**
       * The ID of the audience in Facebook.
       */
      audienceId: string
    }
  }
}
