// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Used for constructing the unique segment_group_id for HubSpot.
   */
  groupid: string
  /**
   * If true, Segment will attempt to update an existing company in HubSpot and if no company is found, Segment will create a new company. If false, Segment will only attempt to update an existing company and never create a new company. This is set to true by default.
   */
  createNewCompany: boolean
  /**
   * If true, Segment will associate the company with the user identified in your payload. If no contact is found in HubSpot, an error is thrown and the company is not created/updated. If false, Segment will not attempt to associate a contact with the company and companies can be created/updated without requiring a contact association. This is set to true by default.
   */
  associateContact: boolean
  /**
   * The unique field(s) used to search for an existing company in HubSpot to update. By default, Segment creates a custom property to store groupId for each company and uses this property to search for companies. If a company is not found, the fields provided here are then used to search. If a company is still not found, a new one is created.
   */
  companysearchfields: {
    [k: string]: unknown
  }
  /**
   * The name of the company.
   */
  name: string
  /**
   * A short statement about the company’s mission and goals.
   */
  description?: string
  /**
   * The street address of the company.
   */
  address?: string
  /**
   * The city where the company is located.
   */
  city?: string
  /**
   * The state or region where the company is located.
   */
  state?: string
  /**
   * The postal or zip code of the company.
   */
  zip?: string
  /**
   * The company’s website domain.
   */
  domain?: string
  /**
   * The company’s primary phone number.
   */
  phone?: string
  /**
   * The total number of people who work for the company.
   */
  numberofemployees?: number
  /**
   * The type of business the company performs.
   */
  industry?: string
  /**
   * The company’s stage within the marketing/sales process. See more information on default and custom stages in [HubSpot’s documentation](https://knowledge.hubspot.com/contacts/use-lifecycle-stages). Segment supports moving status forwards or backwards.
   */
  lifecyclestage?: string
  /**
   * Any other default or custom company properties. On the left-hand side, input the internal name of the property as seen in your HubSpot account. On the right-hand side, map the Segment field that contains the value. Custom properties must be predefined in HubSpot. See more information in [HubSpot’s documentation](https://knowledge.hubspot.com/crm-setup/manage-your-properties#create-custom-properties). Important: Do not use ’segment_group_id’ here as it is an internal property and will result in an an error.
   */
  properties?: {
    [k: string]: unknown
  }
}
