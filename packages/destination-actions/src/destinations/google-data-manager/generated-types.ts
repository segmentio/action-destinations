// Generated file. DO NOT MODIFY IT BY HAND.

export interface Settings {
  /**
   * The product link to use for audience management. This should be in the format `products/DATA_PARTNER/customers/8283492941`.
   */
  productLink: string
}
// Generated file. DO NOT MODIFY IT BY HAND.

export interface AudienceSettings {
  /**
   * The ID of the advertiser in Google Data Manager. This is used to identify the specific advertiser for audience management.
   */
  advertiserId: string
  /**
   * The ID of the operating account, used throughout Google Data Manager. Use this ID when you contact Google support to help our teams locate your specific account.
   */
  operatingAccountId: string
  /**
   * The product for which you want to create or manage audiences.
   */
  product: string[]
  /**
   * The ID of the product destination, used to identify the specific destination for audience management.
   */
  productDestinationId: string
}
