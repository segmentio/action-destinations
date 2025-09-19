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
  /**
   * The name of the contact / user
   */
  contactName?: string
  /**
   * The email of the contact / user
   */
  contactEmail?: string
  /**
   * The phone number of the contact / user
   */
  contactPhone?: string
  /**
   * The role of the contact / user. For example primary, secondary, user, etc
   */
  contactRole?: string
}
