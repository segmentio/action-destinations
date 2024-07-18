// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The constituent's address.
   */
  address?: {
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
  birthdate?: string | number
  /**
   * The birthplace of the constituent.
   */
  birthplace?: string
  /**
   * The ID of the constituent.
   */
  constituent_id?: string
  /**
   * The constituent's email address.
   */
  email?: {
    address?: string
    do_not_email?: boolean
    primary?: boolean
    type?: string
  }
  /**
   * The ethnicity of the constituent.
   */
  ethnicity?: string
  /**
   * The constituent's first name up to 50 characters.
   */
  first?: string
  /**
   * The constituent's former name up to 100 characters.
   */
  former_name?: string
  /**
   * The constituent's gender.
   */
  gender?: string
  /**
   * Indicates whether the constituent gives anonymously.
   */
  gives_anonymously?: boolean
  /**
   * The constituent's income.
   */
  income?: string
  /**
   * The constituent's industry.
   */
  industry?: string
  /**
   * The constituent's last name up to 100 characters. This is required to create a constituent.
   */
  last?: string
  /**
   * The organization-defined identifier for the constituent.
   */
  lookup_id?: string
  /**
   * The constituent's marital status. Available values are the entries in the Marital Status table.
   */
  marital_status?: string
  /**
   * The constituent's online presence.
   */
  online_presence?: {
    address?: string
    primary?: boolean
    type?: string
  }
  /**
   * The constituent's phone number.
   */
  phone?: {
    do_not_call?: boolean
    number?: string
    primary?: boolean
    type?: string
  }
  /**
   * The constituent's preferred name up to 50 characters.
   */
  preferred_name?: string
  /**
   * The religion of the constituent.
   */
  religion?: string
  /**
   * The constituent's primary suffix. Available values are the entries in the Suffixes table.
   */
  suffix?: string
  /**
   * The constituent's secondary suffix. Available values are the entries in the Suffixes table.
   */
  suffix_2?: string
  /**
   * The constituent's primary title. Available values are the entries in the Titles table.
   */
  title?: string
  /**
   * The constituent's secondary title. Available values are the entries in the Titles table.
   */
  title_2?: string
}
