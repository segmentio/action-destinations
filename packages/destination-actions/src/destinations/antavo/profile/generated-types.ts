// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * User ID, selected in Antavo as customer identifier
   */
  customer: string
  /**
   * Antavo Account ID — if the Multi Accounts extension is enabled
   */
  account?: string
  /**
   * Customer properties
   */
  data: {
    /**
     * Customer's first name
     */
    first_name?: string
    /**
     * Customer's last name
     */
    last_name?: string
    /**
     * Customer's email address
     */
    email?: string
    /**
     * Customer's birth date
     */
    birth_date?: string
    /**
     * Customer's gender
     */
    gender?: string
    /**
     * Customer's language
     */
    language?: string
    /**
     * Customer's phone number
     */
    phone?: string
    /**
     * Customer's mobile phone number
     */
    mobile_phone?: string
    [k: string]: unknown
  }
}
