// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * A list of subscription group IDs and states to set. Subscription group states can be either "subscribed" or "unsubscribed". Subscription Group IDs are found in the Braze dashboard.
   */
  subscriptionGroups?: {
    subscription_group_id: string
    subscription_group_state: string
  }[]
}
