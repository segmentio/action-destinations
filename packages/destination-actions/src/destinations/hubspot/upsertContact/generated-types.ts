// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * An Identifier for the Contact. This can be the Contact's email address or the value of any other unique Contact property. If an existing Contact is found, Segment will update the Contact. If a Contact is not found, Segment will create a new Contact.
   */
  email: string
  /**
   * The type of identifier used to uniquely identify the Contact. This defaults to email, but can be set to be any unique Contact property.
   */
  identifier_type?: string
  /**
   * Hidden field use to store the canonical identifier for the Contact during processing.
   */
  canonical_id?: string
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
  /**
   * If true, Segment will batch events before sending to HubSpot’s API endpoint. HubSpot accepts batches of up to 100 events. Note: Contacts created with batch endpoint can’t be associated to a Company from the UpsertCompany Action.
   */
  enable_batching?: boolean
}
