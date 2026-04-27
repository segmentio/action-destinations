// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Select the field to identify contacts.
   */
  channelIdentifier: string
  /**
   * The Contact's email address.
   */
  emailIdentifier?: string
  /**
   * The Contact's mobile number.
   */
  mobileNumberIdentifier?: string
  /**
   * The type of email the contact prefers to receive.
   */
  emailType?: string
  /**
   * The type of opt-in used for this contact. [Learn more](https://support.dotdigital.com/en/articles/8198810-email-opt-in-types)
   */
  optInType?: string
  /**
   * Choose whether to update the email subscription status.
   */
  updateEmailSubscription?: boolean
  /**
   * The subscription status for the email channel.
   */
  emailSubscriptionStatus?: string
  /**
   * When Yes, the action will send a "subscribed" status in the API call for email.
   */
  emailResubscribe?: boolean
  /**
   * If Yes, no resubscription confirmation email will be sent.
   */
  resubscribeWithoutChallengeEmail?: boolean
  /**
   * Choose the language that you would like the resubscribe request email to be sent in.
   */
  preferredLocale?: string
  /**
   * The URL you would like to redirect challenged contacts to after they have completed their resubscription.
   */
  redirectUrlAfterChallenge?: string
  /**
   * Choose whether to update the SMS subscription status.
   */
  updateSmsSubscription?: boolean
  /**
   * The subscription status for the SMS channel.
   */
  smsSubscriptionStatus?: string
  /**
   * The list to add the contact to.
   */
  listId?: number
  /**
   * An object containing key/value pairs for data fields assigned to this Contact. Custom Data Fields must already be defined in Dotdigital.
   */
  dataFields?: {
    [k: string]: unknown
  }
}
