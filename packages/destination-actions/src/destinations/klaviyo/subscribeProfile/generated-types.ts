// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The Unique ID of the profile in Klaviyo. If provided, this will be used to perform the profile lookup. One of email or phone number is still required.
   */
  klaviyo_id?: string
  /**
   * The email address to subscribe or to set on the profile if the email channel is omitted.
   */
  email?: string
  /**
   * Controls the subscription status for email marketing. If set to "yes", the profile's consent preferences for email marketing are set to "SUBSCRIBED"; otherwise, the email channel is omitted.
   */
  subscribe_email: boolean
  /**
   * The phone number to subscribe or to set on the profile if SMS channel is omitted. This must be in E.164 format.
   */
  phone_number?: string
  /**
   * Controls the subscription status for SMS marketing. If set to "yes", the profile's consent preferences for SMS marketing are set to "SUBSCRIBED"; otherwise, the SMS channel is omitted.
   */
  subscribe_sms: boolean
  /**
   * The Klaviyo list to add the newly subscribed profiles to. If no List Id is present, the opt-in process used to subscribe the profile depends on the account's default opt-in settings.
   */
  list_id?: string
  /**
   * The timestamp of when the profile's consent was gathered.
   */
  consented_at?: string | number
}
