// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * If true, Email will be treated as an identifier when sent to Insider. Defaults to true
   */
  email_as_identifier?: boolean
  /**
   * If true, Phone Number will be treated as an identifier when sent to Insider. Defaults to true
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
   * User's unique user ID. UUID should be string and it is used as identifier when sending data to Insider. Either Anonymous ID or UUID is mandatory to send data.
   */
  uuid?: string
  /**
   * Segment Anonymous ID. It is used as identifier when sending data to Insider. Either Anonymous ID or UUID is mandatory to send data.
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
   * Email optin.
   */
  emailOptin?: string
  /**
   * SMS optin.
   */
  smsOptin?: string
  /**
   * Whatsapp optin.
   */
  whatsappOptin?: string
  /**
   * The user's preferred language.
   */
  language?: string
}
