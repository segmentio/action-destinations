// Generated file. DO NOT MODIFY IT BY HAND.

export interface Settings {
  /**
   * The API client id of your Rupt project.
   */
  client_id: string
  /**
   * A URL to redirect the user to if they want to stop account sharing and create a new account.
   */
  new_account_url: string
  /**
   * A URL to redirect the user to if they choose to logout or if they are kicked out by a verified owner.
   */
  logout_url?: string
  /**
   * A URL to redirect the user to if they are successfully verified and are within the device limit.
   */
  success_url?: string
  /**
   * A URL to redirect the user to if they are suspended.
   */
  suspended_url?: string
}
