// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The prospect's email address.
   *         Used to upsert a prospect in Pardot. If multiple prospects have the given email, the prospect with the latest activity is updated. If there's no prospect with the given email, a prospect is created. Please note that Pardot treats email address as case sensitive and will create multiple prospects for casing differences.
   */
  email: string
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
   * If true, the request’s search includes deleted records. This property only affects [AMPSEA accounts](https://help.salesforce.com/s/articleView?id=sf.pardot_admin_ampsea_parent.htm&type=5).
   *       If all records with a matching email address are deleted, the one with the latest activity is undeleted and updated. Otherwise, a new prospect is created.
   */
  secondaryDeletedSearch: boolean
  /**
   *
   *   Additional prospect fields to send to Pardot.
   *   Only editable fields are accepted. Please see [Pardot docs](https://developer.salesforce.com/docs/marketing/pardot/guide/prospect-v5.html#fields) for more details. On the left-hand side, input the Pardot field name. On the right-hand side, map the Segment field that contains the value.
   */
  customFields?: {
    [k: string]: unknown
  }
}
