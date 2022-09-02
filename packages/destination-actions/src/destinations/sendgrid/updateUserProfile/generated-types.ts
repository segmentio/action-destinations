// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * When enabled, the action will use the Sendgrid  Contacts PUT API to perform the operation
   */
  enable_batching?: boolean
  /**
   * The user's first name
   */
  first_name?: string | null
  /**
   * The user's last name
   */
  last_name?: string | null
  /**
   * The user's country
   */
  country?: string | null
  /**
   * The user's postal code
   */
  postal_code?: string | null
  /**
   * The user's city
   */
  city?: string | null
  /**
   * The user's state
   */
  state?: string | null
  /**
   * The user's address line 1
   */
  address_line_1?: string | null
  /**
   * The user's address line 2
   */
  address_line_2?: string | null
  /**
   * The user's phone number
   */
  phone_number?: string | null
  /**
   * The user's whatsapp
   */
  whatsapp?: string | null
  /**
   * The user's line id
   */
  line?: string | null
  /**
   * The user's facebook id
   */
  facebook?: string | null
  /**
   * The user's UniqueName
   */
  unique_name?: string | null
  /**
   * The user's Identity
   */
  identity?: string | null
  /**
   * The user's email address
   */
  primary_email?: string
  /**
   *
   *   Additional fields to send to Sendgrid. On the left-hand side, input the Sendgrid field API name. On the right-hand side, map the Segment field that contains the value.
   *
   *   This can include standard or custom fields. Custom fields must be predefined in your Sendgrid account and the API field name should have __c appended.
   *
   *   ---
   *
   *
   */
  customFields?: {
    [k: string]: unknown
  }
}
