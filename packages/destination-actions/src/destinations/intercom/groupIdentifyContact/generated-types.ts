// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The time the company was created by you.
   */
  remote_created_at?: string | number
  /**
   * A unique identifier for the contact generated outside Intercom. External ID is required to attach a contact to a company if no email or Contact ID is provided.
   */
  external_id?: string
  /**
   * The contact's email address. Email is required to attach a contact to a company if no External ID or Contact ID is provided.
   */
  email?: string
  /**
   * The unique identifier of the company. Once set, this can't be updated.
   */
  company_id: string
  /**
   * The unique identifier for the contact which is given by Intercom. If no Contact ID is provided, Segment will use External ID or email to find a contact to attach to the company.
   */
  contact_id?: string
  /**
   * The name of the company.
   */
  name?: string
  /**
   * The monthly spend of the company, e.g. how much revenue the company generates for your business.
   */
  monthly_spend?: number
  /**
   * The name of the plan you have associated with the company.
   */
  plan?: string
  /**
   * The number of employees in the company.
   */
  size?: number
  /**
   * The URL for the company's website
   */
  website?: string
  /**
   * The industry that the company operates in.
   */
  industry?: string
  /**
   * A hash of key-value pairs containing any other data about the company you want Intercom to store. You can only write to custom attributes that already exist in your Intercom workspace. Please ensure custom attributes are created in Intercom first. See [Intercom documentation](https://developers.intercom.com/intercom-api-reference/reference/create-data-attributes) for more information on creating attributes.
   */
  custom_attributes?: {
    [k: string]: unknown
  }
}
