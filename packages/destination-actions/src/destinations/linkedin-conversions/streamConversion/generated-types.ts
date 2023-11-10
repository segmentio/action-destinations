// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * A dynamic field dropdown which fetches all adAccounts.
   */
  adAccountId: string
}
// Generated bundle for the hooks. DO NOT MODIFY IT BY HAND.

export interface HookBundle {
  onMappingSave: {
    inputs?: {
      /**
       * The ID of an existing conversion rule to stream events to. If defined, we will not create a new conversion rule.
       */
      conversionRuleId?: string
      /**
       * The name of the conversion rule.
       */
      name: string
      /**
       * The type of conversion rule.
       */
      conversionType: string
      /**
       * The attribution type for the conversion rule.
       */
      attribution_type: string
    }
    outputs?: {
      /**
       * The ID of the conversion rule.
       */
      id: string
      /**
       * The name of the conversion rule.
       */
      name: string
      /**
       * The type of conversion rule.
       */
      conversionType: string
    }
  }
}
