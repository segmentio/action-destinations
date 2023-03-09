// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The contact’s email. Email is used to uniquely identify contact records in HubSpot. If an existing contact is found with this email, we will update the contact. If a contact is not found, we will create a new contact.
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
   * The contact's street address, including apartment or unit number.
   */
  address?: string
  /**
   * The contact's city of residence.
   */
  city?: string
  /**
   * The contact's state of residence.
   */
  state?: string
  /**
   * The contact's country of residence.
   */
  country?: string
  /**
   * The contact's zip code.
   */
  zip?: string
  /**
   * The contact’s company/other website.
   */
  website?: string
  /**
   * The contact’s stage within the marketing/sales process. See more information on default and custom stages in [HubSpot’s documentation](https://knowledge.hubspot.com/contacts/use-lifecycle-stages). Segment supports moving status forwards or backwards.
   */
  lifecyclestage?: string
  /**
   * Any other default or custom contact properties. On the left-hand side, input the internal name of the property as seen in your HubSpot account. On the right-hand side, map the Segment field that contains the value. Custom properties must be predefined in HubSpot. See more information in [HubSpot’s documentation](https://knowledge.hubspot.com/crm-setup/manage-your-properties#create-custom-properties).
   */
  properties?: {
    [k: string]: unknown
  }
}
