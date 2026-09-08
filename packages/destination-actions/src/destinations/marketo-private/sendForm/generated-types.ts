// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The name of the Segment event. Only "Form Submitted" and "Registration Succeeded" events are processed.
   */
  event_name: string
  /**
   * The email address of the lead to submit to Marketo.
   */
  email: string
  /**
   * The ID of the Marketo form to submit to.
   */
  formId: string
  /**
   * The full set of lead form fields to submit to the Marketo form.
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
