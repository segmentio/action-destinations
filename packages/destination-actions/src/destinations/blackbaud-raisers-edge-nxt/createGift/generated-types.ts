// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The gift acknowledgement.
   */
  acknowledgement?: {
    date?: string | number
    status?: string
  }
  /**
   * The monetary amount of the gift.
   */
  amount: {
    value: number
  }
  /**
   * The check date in ISO-8601 format.
   */
  check_date?: string | number
  /**
   * The check number.
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
   * The recurring gift associated with the payment being added.
   */
  linked_gifts?: string
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
    date?: string | number
    status?: string
  }
  /**
   * The recurring gift schedule. When adding a recurring gift, a schedule is required.
   */
  recurring_gift_schedule?: {
    end_date?: string | number
    frequency?: string
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
   * The constituent's first name up to 50 characters.
   */
  constituent_first?: string
  /**
   * The constituent's gender.
   */
  constituent_gender?: string
  /**
   * The constituent's income.
   */
  constituent_income?: string
  /**
   * The constituent's last name up to 100 characters. This is required to create a constituent.
   */
  constituent_last?: string
  /**
   * The organization-defined identifier for the constituent.
   */
  constituent_lookup_id?: string
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
}
