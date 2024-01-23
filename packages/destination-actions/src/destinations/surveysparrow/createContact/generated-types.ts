// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Full name of the Contact
   */
  full_name?: string
  /**
   * Phone number of the Contact. This should include + followed by Country Code. For Example, +18004810410
   */
  phone?: string
  /**
   * Mobile number of the Contact. This should include + followed by Country Code. For Example, +18004810410
   */
  mobile?: string
  /**
   * Email address of the Contact
   */
  email?: string
  /**
   * Job title of the contact
   */
  job_title?: string
  /**
   * Key and Values for Custom Properties to be added to the contact. [Contact Property](https://support.surveysparrow.com/hc/en-us/articles/7078996288925-How-to-add-custom-properties-to-your-contact) should be created in SurveySparrow before using here.
   */
  custom_fields?: {
    [k: string]: unknown
  }
}
