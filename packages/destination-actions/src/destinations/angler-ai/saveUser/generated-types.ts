// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The user object.
   */
  user?: {
    /**
     * Whether the customer has consented to receive marketing material by email.
     */
    accepts_marketing?: boolean
    /**
     * The date and time (ISO 8601 format) when the customer consented or objected to receiving marketing material by email.
     */
    accepts_marketing_updated_at?: string
    /**
     * The three-letter code (ISO 4217 format) for the currency that the customer used when they paid for their last order.
     */
    currency?: string
    /**
     * The date and time (ISO 8601 format) when the customer was created.
     */
    created_at?: string
    /**
     * The unique email address of the customer.
     */
    email?: string
    /**
     * Hashed customer's email in SHA256 (lower case).
     */
    hashed_email?: string
    /**
     * Hashed customer's first name in SHA256 (lower case).
     */
    hashed_first_name?: string
    /**
     * Hashed customer's last name in SHA256 (lower case).
     */
    hashed_last_name?: string
    /**
     * Hashed customer's phone in SHA256 (lower case).
     */
    hashed_phone?: string
    /**
     * The customer's first name.
     */
    first_name?: string
    /**
     * A unique identifier for the customer.
     */
    id?: string
    /**
     * The customer's last name.
     */
    last_name?: string
    /**
     * The ID of the customer's last order.
     */
    last_order_id?: string
    /**
     * The name of the customer's last order.
     */
    last_order_name?: string
    /**
     * The marketing subscription opt-in level, as described in the M3AAWG Sender Best Common Practices, that the customer gave when they consented to receive marketing material by email.
     */
    marketing_opt_in_level?: string
    /**
     * A note about the customer.
     */
    note?: string
    /**
     * The number of orders associated with this customer.
     */
    orders_count?: number
    /**
     * The unique phone number (E.164 format) for this customer.
     */
    phone?: string
    /**
     * The state of the customer's account with a shop.
     */
    state?: string
    /**
     * Whether the customer is exempt from paying taxes on their order.
     */
    tax_exempt?: boolean
    /**
     * The total amount of money that the customer has spent across their order history.
     */
    total_spent?: string
    /**
     * The date and time (ISO 8601 format) when the customer information was last updated.
     */
    updated_at?: string
    /**
     * Whether the customer has verified their email address.
     */
    verified_email?: boolean
    [k: string]: unknown
  }
  /**
   * A list of the ten most recently updated addresses for the customer.
   */
  addresses?: {
    /**
     * The customer's mailing address.
     */
    address1?: string
    /**
     * An additional field for the customer's mailing address.
     */
    address2?: string
    /**
     * The customer's city, town, or village.
     */
    city?: string
    /**
     * The customer's country.
     */
    country?: string
    /**
     * The two-letter country code corresponding to the customer's country
     */
    country_code?: string
    /**
     * The customer's first name.
     */
    first_name?: string
    /**
     * The customer's last name.
     */
    last_name?: string
    /**
     * The customer's phone number at this address.
     */
    phone?: string
    /**
     * The customer's region name. Typically a province, a state, or a prefecture
     */
    province?: string
    /**
     * The code for the region of the address, such as the province, state, or district. For example QC for Quebec, Canada.
     */
    province_code?: string
    /**
     * The customer's postal code, also known as zip, postcode, Eircode, etc
     */
    zip?: string
  }[]
  /**
   * The mailing address associated with the payment method.
   */
  default_address?: {
    /**
     * The customer's mailing address.
     */
    address1?: string
    /**
     * An additional field for the customer's mailing address.
     */
    address2?: string
    /**
     * The customer's city, town, or village.
     */
    city?: string
    /**
     * The customer's country.
     */
    country?: string
    /**
     * The two-letter country code corresponding to the customer's country
     */
    country_code?: string
    /**
     * The customer's first name.
     */
    first_name?: string
    /**
     * The customer's last name.
     */
    last_name?: string
    /**
     * The customer's phone number at this address.
     */
    phone?: string
    /**
     * The customer's region name. Typically a province, a state, or a prefecture
     */
    province?: string
    /**
     * The code for the region of the address, such as the province, state, or district. For example QC for Quebec, Canada.
     */
    province_code?: string
    /**
     * The customer's postal code, also known as zip, postcode, Eircode, etc
     */
    zip?: string
  }
  /**
   * The marketing consent information when the customer consented to receiving marketing material by email.
   */
  email_marketing_consent?: {
    /**
     * The current email marketing state for the customer.
     */
    state?: string
    /**
     * The marketing subscription opt-in level, as described in the M3AAWG Sender Best Common Practices, that the customer gave when they consented to receive marketing material by email.
     */
    opt_in_level?: string
    /**
     * The date and time when the customer consented to receive marketing material by email. If no date is provided, then the date and time when the consent information was sent is used.
     */
    consent_updated_at?: string
  }
  /**
   * Attaches additional metadata to a shop's resources.
   */
  metafield?: {
    /**
     * An identifier for the metafield.
     */
    key?: string
    /**
     * A container for a set of metadata. Namespaces help distinguish between metadata that you created and metadata created by another individual with a similar namespace.
     */
    namespace?: string
    /**
     * Information to be stored as metadata.
     */
    value?: string
    /**
     * The type.
     */
    type?: string
  }
  /**
   * The marketing consent information when the customer consented to receiving marketing material by SMS.
   */
  sms_marketing_consent?: {
    /**
     * The state of the SMS marketing consent.
     */
    state?: string
    /**
     * The marketing subscription opt-in level, as described in the M3AAWG Sender Best Common Practices, that the customer gave when they consented to receive marketing material by SMS.
     */
    opt_in_level?: string
    /**
     * The date and time when the customer consented to receive marketing material by SMS. If no date is provided, then the date and time when the consent information was sent is used.
     */
    consent_updated_at?: string
    /**
     * The source for whether the customer has consented to receive marketing material by SMS.
     */
    consent_collected_from?: string
  }
}
