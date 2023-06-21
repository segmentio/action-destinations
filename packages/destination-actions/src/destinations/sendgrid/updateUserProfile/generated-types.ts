// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * When enabled, the action will use the SendGrid Contacts PUT API to perform the batch operation. Batches can contain up to 30k records in a request.
   */
  enable_batching?: boolean
  /**
   * The contact's first name.
   */
  first_name?: string | null
  /**
   * The contact's last name.
   */
  last_name?: string | null
  /**
   * The contact's country.
   */
  country?: string | null
  /**
   * The contact's postal code.
   */
  postal_code?: string | null
  /**
   * The contact's city.
   */
  city?: string | null
  /**
   * The contact's state.
   */
  state?: string | null
  /**
   * The contact's address line 1.
   */
  address_line_1?: string | null
  /**
   * The contact's address line 2.
   */
  address_line_2?: string | null
  /**
   * The contact's phone number.
   */
  phone_number?: string | null
  /**
   * The contact's WhatsApp.
   */
  whatsapp?: string | null
  /**
   * The contact's LINE ID.
   */
  line?: string | null
  /**
   * The contact's Facebook ID.
   */
  facebook?: string | null
  /**
   * The contact's unique name.
   */
  unique_name?: string | null
  /**
   * The contact's identity.
   */
  identity?: string | null
  /**
   * The contact's email address.
   */
  primary_email: string
  /**
   *
   *   Additional fields to send to SendGrid. On the left-hand side, input the SendGrid Custom Fields Id. On the right-hand side, map the Segment field that contains the value.
   *
   *   Custom Fields must be predefined in your SendGrid account and you can retrieve corresponding Id using get all field definitions endpoint.
   *
   *   Reference: [Get All field definitions](https://docs.sendgrid.com/api-reference/custom-fields/get-all-field-definitions)
   *   ---
   *
   *
   */
  customFields?: {
    [k: string]: unknown
  }
}
