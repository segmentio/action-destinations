// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * If true, Email will be sent as identifier to Insider.
   */
  email_as_identifier?: boolean
  /**
   * If true, Phone Number will be sent as identifier to Insider
   */
  phone_number_as_identifier?: boolean
  /**
   * Age of a user.
   */
  age?: number
  /**
   * User’s birthday
   */
  birthday?: string
  /**
   * Email address of a user.
   */
  email?: string
  /**
   * First name of a user.
   */
  firstName?: string
  /**
   * Gender of a user.
   */
  gender?: string
  /**
   * Last name of a user.
   */
  lastName?: string
  /**
   * User's phone number in E.164 format (e.g. +6598765432), can be used as an identifier.
   */
  phone?: string
  /**
   * User's unique identifier. The UUID string is used as identifier when sending data to Insider. UUID is required if the Anonymous Id field is empty.
   */
  uuid?: string
  /**
   * An Anonymous Identifier. The Anonymous Id string is used as identifier when sending data to Insider. Anonymous Id is required if the UUID field is empty.
   */
  segment_anonymous_id?: string
  /**
   * City
   */
  city?: string
  /**
   * Country
   */
  country?: string
  /**
   * GDPR opt-in.
   */
  gdprOptin?: boolean
  /**
   * Email opt-in.
   */
  emailOptin?: boolean
  /**
   * SMS opt-in.
   */
  smsOptin?: boolean
  /**
   * Whatsapp opt-in.
   */
  whatsappOptin?: boolean
  /**
   * The user's preferred language.
   */
  language?: string
  /**
   * The user's additional information.
   */
  custom?: {
    [k: string]: unknown
  }
}
