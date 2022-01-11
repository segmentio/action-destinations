// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Date of cart creation. Default to current date and time.
   */
  DateCreated: string | number
  /**
   * Order number from e-commerce platform.
   */
  OrderNumber?: string
  /**
   * Order id from e-commerce platform (same as checkout id).
   */
  SourceId?: string
  /**
   * A reference to the order that is a string value.
   */
  TokenId?: string
  /**
   * Customer ID from e-commerce platform.
   */
  CustomerId: string
  /**
   * Link for user to click on to see status.
   */
  Url: string
  /**
   * Total Order Value.
   */
  OrderTotal: number
  /**
   * Total customer lifetime spend.
   */
  TotalSpent: number
  /**
   * Customer's first name.
   */
  FirstName?: string
  /**
   * Customer's last name.
   */
  lastName?: string
  /**
   * Customer's phone number.
   */
  Phone: string
  /**
   * Customer's email address
   */
  Email?: string
  /**
   * Customer's postal code
   */
  Zip: string
  /**
   * The date and time when the updates interacted with.
   */
  LastUpdated?: string | number
  /**
   * URL with product image.
   */
  ProductImageUrl?: string
  /**
   * Used as a key to link events together.
   */
  LinkReference?: string
  /**
   * URL of the tenant's e-commerce homepage.
   */
  HomepageUrl?: string
}
