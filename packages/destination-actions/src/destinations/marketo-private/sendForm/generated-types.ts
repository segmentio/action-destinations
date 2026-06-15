// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The name of the Segment event. Used to route the submission to the correct Marketo form.
   */
  event_name: string
  /**
   * The full set of event properties. Used to determine the destination Marketo form, campaign, and any route-specific fields.
   */
  properties?: {
    [k: string]: unknown
  }
  /**
   * The email address of the lead.
   */
  email?: string
  /**
   * The first name of the lead.
   */
  first_name?: string
  /**
   * The last name of the lead.
   */
  last_name?: string
  /**
   * The phone number of the lead.
   */
  phone?: string
  /**
   * The company of the lead.
   */
  company?: string
  /**
   * The country of the lead.
   */
  country?: string
  /**
   * The city of the lead.
   */
  city?: string
  /**
   * The state or province of the lead.
   */
  state?: string
  /**
   * The ZIP or postal code of the lead.
   */
  zip?: string
  /**
   * The job function of the lead.
   */
  job_function?: string
  /**
   * Free-form comments submitted with the form.
   */
  comments?: string
  /**
   * Notes submitted with the form.
   */
  notes?: string
  /**
   * The title of the collateral associated with the submission.
   */
  collateral_title?: string
  /**
   * The URL of the collateral associated with the submission.
   */
  collateral_url?: string
  /**
   * The lead source of the submission. Also used to route splash / online education forms.
   */
  lead_source?: string
  /**
   * Whether the lead opted in.
   */
  opt_in?: boolean
  /**
   * The utm_term marketing parameter.
   */
  utm_term?: string
  /**
   * The utm_medium marketing parameter.
   */
  utm_medium?: string
  /**
   * The utm_content marketing parameter.
   */
  utm_content?: string
  /**
   * The utm_campaign marketing parameter.
   */
  utm_campaign?: string
  /**
   * The utm_source marketing parameter.
   */
  utm_source?: string
  /**
   * The Salesforce ad campaign id (utm_ad_campaign_id).
   */
  utm_ad_campaign_id?: string
  /**
   * The external referrer URL. Truncated to 255 characters.
   */
  external_referrer?: string
  /**
   * The referrer URL. Truncated to 255 characters.
   */
  referrer?: string
  /**
   * The Google Click Identifier (gclid).
   */
  gclid?: string
  /**
   * The tck tracking parameter.
   */
  tck?: string
  /**
   * The ad id (adid_p).
   */
  ad_id?: string
  /**
   * The ad set id (adsetid_p).
   */
  ad_set_id?: string
  /**
   * The URL of the page where the form was submitted. Truncated to 255 characters.
   */
  page_url?: string
  /**
   * The query string of the page where the form was submitted.
   */
  query_string?: string
  /**
   * The user agent string of the visitor.
   */
  user_agent?: string
  /**
   * The Marketo Munchkin cookie (_mkto_trk) associating the submission with a known visitor.
   */
  marketo_cookie?: string
  /**
   * Custom field 1.
   */
  custom_field_1?: string
  /**
   * Custom field 2.
   */
  custom_field_2?: string
  /**
   * Custom field 3.
   */
  custom_field_3?: string
  /**
   * Custom field 4.
   */
  custom_field_4?: string
  /**
   * Custom field 5.
   */
  custom_field_5?: string
  /**
   * Custom field 6.
   */
  custom_field_6?: string
  /**
   * Custom field 7.
   */
  custom_field_7?: string
  /**
   * Custom field 8.
   */
  custom_field_8?: string
  /**
   * Custom field 9.
   */
  custom_field_9?: string
  /**
   * Custom field 10.
   */
  custom_field_10?: string
}
