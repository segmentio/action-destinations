// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {}
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
