// Generated file. DO NOT MODIFY IT BY HAND.

export interface Settings {
  /**
   * Your client code is available at the top of the Administration > Implementation page of the Target interface.
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
   * The name of the mbox to use
   */
  mbox_name: string
  /**
   * The domain of the platform that your integration will run on
   */
  cookie_domain: string
}
