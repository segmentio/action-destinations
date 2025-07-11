// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Customer wallet identity value in AIR for this event
   */
  identityValue: string
  /**
   * Optional wallet transaction reference from the event triggering this Behavioral Action
   */
  walletTransactionReference?: string
  /**
   * If connecting to an Engage Audience the default mapping should be left as is. This field accepts a comma delimited list of reference strings for the Behavioral Action to be executed. E.g.: A0001,P0001
   */
  behavioralActionTriggerReferences: string
}
