// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The Parodt operation performed. The available operation is upsert.
   */
  operation: string
  /**
   * The prospect's email address. **This is required to upsert prospect. If multiple prospects have the given email, the prospect with the latest activity is updated. If there's no prospect with the given email, a prospect is created.**
   */
  email?: string
  /**
   * The prospect's first name.
   */
  firstName?: string
  /**
   * The prospect's last name.
   */
  lastName?: string
  /**
   * The prospect's formal prefix.
   */
  salutation?: string
  /**
   * The prospect's phone number.
   */
  phone?: string
  /**
   * The prospect's company.
   */
  company?: string
  /**
   * The prospect's job title.
   */
  jobTitle?: string
  /**
   * The prospect's industry.
   */
  industry?: string
  /**
   * The prospect's city.
   */
  city?: string
  /**
   * The prospect's US state.
   */
  state?: string
  /**
   * The prospect's postal code.
   */
  zip?: string
  /**
   * The prospect's country.
   */
  country?: string
  /**
   * The prospect's website URL.
   */
  website?: string
  /**
   *
   *   Additional prospect fields to send to Pardot. Only editable fields are accepted. On the left-hand side, input the Pardot field name. On the right-hand side, map the Segment field that contains the value.
   *   ---
   *
   */
  customFields?: {
    [k: string]: unknown
  }
}
