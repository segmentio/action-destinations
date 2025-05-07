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
   * Accepts a comma delimited list of reference strings for the Behavioral Action to be executed. E.g.: A0001,P0001
   */
  behavioralActionTriggerReferences: string
}
