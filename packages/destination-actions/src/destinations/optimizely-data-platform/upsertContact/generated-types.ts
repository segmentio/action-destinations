// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Identifier email address
   */
  email: string
  /**
   * Company Name
   */
  company?: string
  /**
   * Person title
   */
  title?: string
  /**
   * Person Full Name
   */
  name?: string
  /**
   * First name
   */
  firstname?: string
  /**
   * Last name.
   */
  lastname?: string
  /**
   * Person Gender
   */
  gender?: string
  /**
   * Birthday
   */
  DOB?: string
  /**
   * Phone number.
   */
  phone?: string
  /**
   * Address details object
   */
  address?: {
    [k: string]: unknown
  }
  /**
   * user image
   */
  imageURL?: string
  /**
   * Properties
   */
  properties?: {
    [k: string]: unknown
  }
}
