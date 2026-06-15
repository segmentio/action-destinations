// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The name of the Segment event. Used to route the submission to the correct Marketo form. Only "Form Submitted" and "Registration Succeeded" events are processed.
   */
  event_name: string
  /**
   * The email address of the lead to submit to Marketo.
   */
  email: string
  /**
   * The ID of the Marketo form to submit to. This can be set on the event properties or determined by the destination based on other event properties.
   */
  formId: string
  /**
   * The full set of lead form fields. Used to determine the destination Marketo form, campaign, and any route-specific fields.
   */
  leadFormFields: {
    [k: string]: unknown
  }
  /**
   * The visitor data to send to Marketo. This is used to associate the lead with the correct visitor in Marketo.
   */
  visitorData: {
    [k: string]: unknown
  }
  /**
   * The Marketo cookie to send to Marketo. This is used to associate the lead with the correct visitor in Marketo.
   */
  cookie?: string
}
