// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The action date in ISO-8601 format.
   */
  date: string | number
  /**
   * The channel or intent of the constituent interaction. Available values are Phone Call, Meeting, Mailing, Email, and Task/Other.
   */
  category: string
  /**
   * Indicates whether the action is complete.
   */
  completed?: boolean
  /**
   * The date when the action was completed in ISO-8601 format.
   */
  completed_date?: string | number
  /**
   * The detailed explanation that elaborates on the action summary.
   */
  description?: string
  /**
   * The direction of the action. Available values are "Inbound" and "Outbound".
   */
  direction?: string
  /**
   * The end time of the action. Uses 24-hour time in the HH:mm format. For example, 17:30 represents 5:30 p.m.
   */
  end_time?: string
  /**
   * The set of immutable constituent system record IDs for the fundraisers associated with the action.
   */
  fundraisers?: string[]
  /**
   * The location of the action. Available values are the entries in the Action Locations table.
   */
  location?: string
  /**
   * The immutable system record ID of the opportunity associated with the action.
   */
  opportunity_id?: string
  /**
   * The outcome of the action. Available values are Successful and Unsuccessful.
   */
  outcome?: string
  /**
   * The priority of the action. Available values are Normal, High, and Low.
   */
  priority?: string
  /**
   * The start time of the action. Uses 24-hour time in the HH:mm format. For example, 17:30 represents 5:30 p.m.
   */
  start_time?: string
  /**
   * The action status. If the system is configured to use custom action statuses, available values are the entries in the Action Status table.
   */
  status?: string
  /**
   * The short description of the action that appears at the top of the record. Limited to 255 characters.
   */
  summary?: string
  /**
   * Additional description of the action to complement the category. Available values are the entries in the Actions table.
   */
  type?: string
  /**
   * The author of the action's summary and description. If not supplied, will have a default set based on the user's account. Limited to 50 characters.
   */
  author?: string
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
