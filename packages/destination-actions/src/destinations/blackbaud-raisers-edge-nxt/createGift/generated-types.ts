// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The gift acknowledgement.
   */
  acknowledgement?: {
    /**
     * The date associated with the acknowledgement in ISO-8601 format.
     */
    date?: string | number
    /**
     * The status of the acknowledgement. Available values are: ACKNOWLEDGED, NEEDSACKNOWLEDGEMENT, and DONOTACKNOWLEDGE.
     */
    status?: string
  }
  /**
   * The monetary amount of the gift in number format, e.g. 12.34
   */
  amount: number
  /**
   * The check date in ISO-8601 format.
   */
  check_date?: string | number
  /**
   * The check number in string format, e.g. "12345"
   */
  check_number?: string
  /**
   * The gift date in ISO-8601 format.
   */
  date?: string | number
  /**
   * The ID of the fund associated with the gift.
   */
  fund_id: string
  /**
   * The status of the gift. Available values are "Active", "Held", "Terminated", "Completed", and "Cancelled".
   */
  gift_status?: string
  /**
   * Indicates whether the gift is anonymous.
   */
  is_anonymous?: boolean
  /**
   * The recurring gift associated with the payment being added. When adding a recurring gift payment, a linked_gifts field must be included as an array of strings with the ID of the recurring gift to which the payment is linked.
   */
  linked_gifts?: string[]
  /**
   * The organization-defined identifier for the gift.
   */
  lookup_id?: string
  /**
   * The payment method. Available values are "Cash", "CreditCard", "PersonalCheck", "DirectDebit", "Other", "PayPal", or "Venmo".
   */
  payment_method: string
  /**
   * The date that the gift was posted to general ledger in ISO-8601 format.
   */
  post_date?: string | number
  /**
   * The general ledger post status of the gift. Available values are "Posted", "NotPosted", and "DoNotPost".
   */
  post_status?: string
  /**
   * The gift receipt.
   */
  receipt?: {
    /**
     * The date that the gift was receipted. Includes an offset from UTC in ISO-8601 format: 1969-11-21T10:29:43.
     */
    date?: string | number
    /**
     * The receipt status of the gift. Available values are RECEIPTED, NEEDSRECEIPT, and DONOTRECEIPT.
     */
    status?: string
  }
  /**
   * The recurring gift schedule. When adding a recurring gift, a schedule is required.
   */
  recurring_gift_schedule?: {
    /**
     * Date the recurring gift should end in ISO-8601 format.
     */
    end_date?: string | number
    /**
     * Installment frequency of the recurring gift to add. Available values are WEEKLY, EVERY_TWO_WEEKS, EVERY_FOUR_WEEKS, MONTHLY, QUARTERLY, ANNUALLY.
     */
    frequency?: string
    /**
     * Date the recurring gift should start in ISO-8601 format.
     */
    start_date?: string | number
  }
  /**
   * The subtype of the gift.
   */
  subtype?: string
  /**
   * The gift type. Available values are "Donation", "Other", "GiftInKind", "RecurringGift", and "RecurringGiftPayment".
   */
  type?: string
  /**
   * The constituent's address.
   */
  constituent_address?: {
    address_lines?: string
    city?: string
    country?: string
    do_not_mail?: boolean
    postal_code?: string
    primary?: boolean
    state?: string
    type?: string
  }
  /**
   * The constituent's birthdate.
   */
  constituent_birthdate?: string | number
  /**
   * The birthplace of the constituent.
   */
  constituent_birthplace?: string
  /**
   * The ID of the constituent.
   */
  constituent_id?: string
  /**
   * The constituent's email address.
   */
  constituent_email?: {
    address?: string
    do_not_email?: boolean
    primary?: boolean
    type?: string
  }
  /**
   * The ethnicity of the constituent.
   */
  constituent_ethnicity?: string
  /**
   * The constituent's first name up to 50 characters.
   */
  constituent_first?: string
  /**
   * The constituent's former name up to 100 characters.
   */
  constituent_former_name?: string
  /**
   * The constituent's gender.
   */
  constituent_gender?: string
  /**
   * Indicates whether the constituent gives anonymously.
   */
  constituent_gives_anonymously?: boolean
  /**
   * The constituent's income.
   */
  constituent_income?: string
  /**
   * The constituent's industry.
   */
  constituent_industry?: string
  /**
   * The constituent's last name up to 100 characters. This is required to create a constituent.
   */
  constituent_last?: string
  /**
   * The organization-defined identifier for the constituent.
   */
  constituent_lookup_id?: string
  /**
   * The constituent's marital status. Available values are the entries in the Marital Status table.
   */
  constituent_marital_status?: string
  /**
   * The constituent's online presence.
   */
  constituent_online_presence?: {
    address?: string
    primary?: boolean
    type?: string
  }
  /**
   * The constituent's phone number.
   */
  constituent_phone?: {
    do_not_call?: boolean
    number?: string
    primary?: boolean
    type?: string
  }
  /**
   * The constituent's preferred name up to 50 characters.
   */
  constituent_preferred_name?: string
  /**
   * The religion of the constituent.
   */
  constituent_religion?: string
  /**
   * The constituent's primary suffix. Available values are the entries in the Suffixes table.
   */
  constituent_suffix?: string
  /**
   * The constituent's secondary suffix. Available values are the entries in the Suffixes table.
   */
  constituent_suffix_2?: string
  /**
   * The constituent's primary title. Available values are the entries in the Titles table.
   */
  constituent_title?: string
  /**
   * The constituent's secondary title. Available values are the entries in the Titles table.
   */
  constituent_title_2?: string
}
