// Generated file. DO NOT MODIFY IT BY HAND.

export interface Settings {
  /**
   * Your Adobe Target client code. To find your client code in Adobe Target, navigate to **Administration > Implementation**. The client code is shown at the top under Account Details.
   */
  client_code: string
  /**
   * If you choose to require authentication for Adobe Target's Profile API, you will need to generate an authentication token. Tokens can be generated in your Adobe Target account under the Implementation Settings tab or via the [Adobe.IO Authentication Token API](https://developers.adobetarget.com/api/#authentication-tokens). Input the authentication token here. Note: Authentication tokens expire so a new token will need to be generated and updated here prior to expiration.
   */
  bearer_token?: string
}
