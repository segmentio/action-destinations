// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Full name of the Contact
   */
  full_name?: string
  /**
   * Non Mobile Phone number for the Contact. This should include + followed by Country Code. For Example, +18004810410
   */
  phone?: string
  /**
   * Mobile number for the Contact. This should include + followed by Country Code. For Example, +18004810410
   */
  mobile?: string
  /**
   * Email Address for the Contact
   */
  email?: string
  /**
   * Job Title for the Contact
   */
  job_title?: string
  /**
   * Key:Value Custom Properties to be added to the Contact in SurveySparrow. [Contact Property](https://support.surveysparrow.com/hc/en-us/articles/7078996288925-How-to-add-custom-properties-to-your-contact) should be created in SurveySparrow in advance.
   */
  custom_fields?: {
    [k: string]: unknown
  }
}
