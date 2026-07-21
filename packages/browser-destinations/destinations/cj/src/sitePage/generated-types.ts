// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * A unique ID assigned by you to the user.
   */
  userId?: string
  /**
   * Your CJ Enterprise ID.
   */
  enterpriseId: number
  /**
   * Page type to be sent to CJ.
   */
  pageType: string
  /**
   * The referring channel to be sent to CJ.
   */
  referringChannel?: string
  /**
   * The cart subtotal to be sent to CJ.
   */
  cartSubtotal?: number
  /**
   * The items to be sent to CJ.
   */
  items?: {
    /**
     * the price of the item before tax and discount.
     */
    unitPrice: number
    /**
     * The item sku.
     */
    itemId: string
    /**
     * The quantity of the item.
     */
    quantity: number
    /**
     * The discount applied to the item.
     */
    discount?: number
  }[]
}
