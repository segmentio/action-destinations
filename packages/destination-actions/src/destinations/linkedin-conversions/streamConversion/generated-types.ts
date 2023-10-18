// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {}
// Generated inputs for the on-subscription-save hook. DO NOT MODIFY IT BY HAND.

export interface SubscriptionSaveInputs {
  /**
   * The name of the conversion rule.
   */
  name: string
  /**
   * The type of conversion rule.
   */
  conversionType: string
  /**
   * The account to associate this conversion rule with.
   */
  account: string
  /**
   * The attribution type for the conversion rule.
   */
  attribution_type: string
}
// Generated outputs for the on-subscription-save hook. DO NOT MODIFY IT BY HAND.

export interface SubscriptionSaveOutputs {
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
