// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The Profile Space to use for creating a record. *Note: This field shows list of internal sources associated with the Profile Space. Changes made to the Profile Space name in **Settings** will not reflect in this list unless the source associated with the Profile Space is renamed explicitly.*
   */
  engage_space: string
  /**
   * Unique identifier for the user in your database.
   */
  user_id?: string
  /**
   * A pseudo-unique substitute for a User ID, for cases when you don’t have an absolutely unique identifier.
   */
  anonymous_id?: string
  /**
   * Email of the user
   */
  email?: string
  /**
   * Global status of the email subscription. True is subscribed, false is unsubscribed, and did_not_subscribe is did_not_subscribe.
   */
  email_subscription_status?: string | null
  /**
   * Group Subscription statuses are supported for the email channel. This object contains group names as keys and statuses as values. True is subscribed, false is unsubscribed, and did_not_subscribe is did_not_subscribe.
   */
  subscription_groups?: {
    [k: string]: unknown
  }
  /**
   * Phone number of the user
   */
  phone?: string
  /**
   * Global status of the SMS subscription. True is subscribed, false is unsubscribed, and did_not_subscribe is did_not_subscribe.
   */
  sms_subscription_status?: string | null
  /**
   * Global status of the WhatsApp subscription. True is subscribed, false is unsubscribed, and did_not_subscribe is did_not_subscribe.
   */
  whatsapp_subscription_status?: string | null
  /**
   * Android Push Token of the user
   */
  android_push_token?: string
  /**
   * Global status of the android push subscription. True is subscribed, false is unsubscribed, and did_not_subscribe is did_not_subscribe.
   */
  android_push_subscription_status?: string | null
  /**
   * Ios Push Token of the user
   */
  ios_push_token?: string
  /**
   * Global status of the ios push subscription. True is subscribed, false is unsubscribed, and did_not_subscribe is did_not_subscribe.
   */
  ios_push_subscription_status?: string | null
  /**
   * Free-form dictionary of traits that describe the user or group of users.
   */
  traits?: {
    [k: string]: unknown
  }
  /**
   * The timestamp of the event.
   */
  timestamp?: string | number
}
