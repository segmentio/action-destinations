// Generated file. DO NOT MODIFY IT BY HAND.

export interface Settings {
  /**
   * Your Adobe Target client code. To find your client code in Adobe Target, navigate to **Administration > Implementation**. The client code is shown at the top under Account Details.
   */
  client_code: string
  /**
   * Your Adobe Target admin number. To find your admin number, please follow the instructions in [Adobe Docs](https://experienceleague.adobe.com/docs/target/using/implement-target/client-side/at-js-implementation/deploy-at-js/implementing-target-without-a-tag-manager.html).
   */
  admin_number: string
  /**
   * The version of ATJS to use. Defaults to 2.8.0.
   */
  version: string
  /**
   * The name of the Adobe Target mbox to use. Defaults to `target-global-mbox`.
   */
  mbox_name: string
  /**
   * The domain from which you serve the mbox. Adobe Target recommends setting this value to your company's top-level domain.
   */
  cookie_domain: string
}
