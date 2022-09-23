// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The contact’s email.
   */
  email: string
  /**
   * The contact’s company.
   */
  company?: string
  /**
   * The contact’s first name.
   */
  firstname?: string
  /**
   * The contact’s last name.
   */
  lastname?: string
  /**
   * The contact’s phone number.
   */
  phone?: string
  /**
   * The contact’s company/other website.
   */
  website?: string
  /**
   * Any other default or custom contact properties. Custom properties must be predefined in HubSpot. More information in HubSpot documentation.
   */
  otherFields?: {
    [k: string]: unknown
  }
}
