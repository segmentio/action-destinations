// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The customer's own identifier for this person, used as the stable match key in GainTrace. Required unless an Email is provided.
   */
  userId?: string
  /**
   * The customer's own identifier for the company this person belongs to, normally the Segment group ID. GainTrace creates the company if it has not seen it yet.
   */
  accountExternalId: string
  /**
   * The email address of the person. Used as a secondary match key.
   */
  email?: string
  /**
   * The full name of the person. Falls back to the email local part when absent.
   */
  name?: string
  /**
   * The phone number of the person.
   */
  phone?: string
  /**
   * The job title or role of the person.
   */
  role?: string
  /**
   * All other traits to store on the person. Segment Engage computed traits and audience membership arrive here and are merged with existing traits rather than replacing them.
   */
  traits?: {
    [k: string]: unknown
  }
}
