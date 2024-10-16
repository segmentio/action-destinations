// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The unique identifier for the Shopify shop. This is used to associate the customer with a Shopify shop in Mantle
   */
  platformId: string
  /**
   * The unique .myshopify.com domain of the Shopify shop. This is used to associate the customer with a Shopify shop in Mantle
   */
  myshopifyDomain: string
  /**
   * The name of the customer / shop
   */
  name?: string
  /**
   * The email of the customer
   */
  email?: string
  /**
   * The name of the plan the customer is on on the platform (Shopify)
   */
  platformPlanName?: string
  /**
   * The custom fields of the customer / shop
   */
  customFields?: {
    [k: string]: unknown
  }
}
