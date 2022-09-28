// Generated file. DO NOT MODIFY IT BY HAND.

export interface Settings {
  /**
   * Your Adobe Target client code. To find your client code in Adobe Target, navigate to **Administration > Implementation**. The client code is shown at the top under Account Details.
   */
  client_code: string
  /**
   * Self managed bearer token generated via [Adobe's authentication API](https://developers.adobetarget.com/api/#authentication-tokens). Expires every 90 days.
   */
  bearer_token?: string
}
