// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * If the contact does not exist in your Dotdigital account, the campaign won't be sent.
   */
  email: string
  /**
   * The campaign to email to a contact.
   */
  campaignId: number
  /**
   * The campaign will be sent immediately if the send date is left blank.
   */
  sendDate?: string | number
  /**
   * Send the campaign at the most appropriate time based upon their previous opens.
   */
  sendTimeOptimised?: boolean
}
