// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Additional name for custom events if 'event_name' is 'custom_event'.
   */
  custom_event_name?: string
  /**
   * Cart Line details
   */
  cartLine?: {
    /**
     * A globally unique identifier for the item.
     */
    id?: string
    /**
     * Identifier for the variant of the product
     */
    variantId?: string
    /**
     * The location of the image as a URL.
     */
    imageSrc?: string
    /**
     * The price of the product variant.
     */
    priceAmount?: number
    /**
     * The SKU (stock keeping unit) associated with the variant.
     */
    sku?: string
    /**
     * The product variant's title.
     */
    title?: string
    /**
     * The product variant's untranslated title.
     */
    untranslatedTitle?: string
    /**
     * The product's vendor name.
     */
    vendor?: string
    /**
     * The product type specified by the merchant.
     */
    type?: string
    /**
     * The relative URL of the product.
     */
    url?: string
    /**
     * Quantity of the item
     */
    quantity?: number
  }
  /**
   * A unique event identifier.
   */
  eventId?: string
  /**
   * The name of the event to track.
   */
  eventName?: string
  /**
   * The IP address of the user.
   */
  ipAddress?: string
  /**
   * The user agent of the device sending the event.
   */
  userAgent?: string
  /**
   * The timestamp when the event was triggered.
   */
  timestamp?: string
  /**
   * Identifiers for the user
   */
  identifiers?: {
    /**
     * Segment User ID.
     */
    userId?: string
    /**
     * Segment anonymous ID.
     */
    anonymousId?: string
    /**
     * Client ID.
     */
    clientId?: string
    /**
     * Facebook Pixel ID. This is a cookie which is unique to each user.
     */
    fbp?: string
    /**
     * Facebook Click ID. This is a cookie which is unique to each user.
     */
    fbc?: string
    /**
     * Google Analytics ID. This is a cookie which is unique to each user.
     */
    ga?: string
    [k: string]: unknown
  }
  /**
   * Page details to send with the event
   */
  page?: {
    /**
     * The URL where the event occurred.
     */
    url?: string
    /**
     * The referring URL if applicable.
     */
    referrer?: string
  }
  /**
   * A globally unique identifier for the cart.
   */
  cartId?: string
  /**
   * Decimal money amount.
   */
  totalAmount?: number
  /**
   * The currency code of the money.
   */
  currencyCode?: string
  /**
   * Cart Line Item details
   */
  cartLines?: {
    /**
     * A globally unique identifier for the item.
     */
    id?: string
    /**
     * Identifier for the variant of the product
     */
    variantId?: string
    /**
     * The location of the image as a URL.
     */
    imageSrc?: string
    /**
     * The price of the product variant.
     */
    priceAmount?: number
    /**
     * The SKU (stock keeping unit) associated with the variant.
     */
    sku?: string
    /**
     * The product variant's title.
     */
    title?: string
    /**
     * The product variant's untranslated title.
     */
    untranslatedTitle?: string
    /**
     * The product's vendor name.
     */
    vendor?: string
    /**
     * The product type specified by the merchant.
     */
    type?: string
    /**
     * The relative URL of the product.
     */
    url?: string
    /**
     * Quantity of the item
     */
    quantity?: number
  }[]
  /**
   * Customer details
   */
  customer?: {
    /**
     * The customer's email address.
     */
    email?: string
    /**
     * The customer's first name.
     */
    firstName?: string
    /**
     * The customer's last name.
     */
    lastName?: string
    /**
     * The unique phone number (E.164 format) for this customer.
     */
    phone?: string
    /**
     * The customer's date of birth.
     */
    dob?: string
  }
  /**
   * Custom attributes for the event. Data should be specified as key:value pairs
   */
  customAttributes?: {
    [k: string]: unknown
  }
  /**
   * Checkout Line Item details
   */
  checkoutLineItems?: {
    /**
     * A globally unique identifier for the item.
     */
    id?: string
    /**
     * Identifier for the variant of the product
     */
    variantId?: string
    /**
     * The location of the image as a URL.
     */
    imageSrc?: string
    /**
     * The price of the product variant.
     */
    priceAmount?: number
    /**
     * The SKU (stock keeping unit) associated with the variant.
     */
    sku?: string
    /**
     * The product variant's title.
     */
    title?: string
    /**
     * The product variant's untranslated title.
     */
    untranslatedTitle?: string
    /**
     * The product's vendor name.
     */
    vendor?: string
    /**
     * The product type specified by the merchant.
     */
    type?: string
    /**
     * The relative URL of the product.
     */
    url?: string
    /**
     * Quantity of the item
     */
    quantity?: number
    /**
     * The Discount Code applied to the item.
     */
    discountTitle?: string
    /**
     * The Discount value applied to the item.
     */
    discountValue?: number
  }[]
  /**
   * The ID of the order associated with this checkout.
   */
  orderId?: string
  /**
   * A monetary value.
   */
  subtotalPriceAmount?: number
  /**
   * A monetary value with currency.
   */
  totalTaxAmount?: number
  /**
   * A monetary value.
   */
  shippingLinePriceAmount?: number
  /**
   * Collection details
   */
  collection?: {
    /**
     * A globally unique identifier for the collection.
     */
    id?: string
    /**
     * The collection title.
     */
    title?: string
  }
  /**
   * A list of product variants associated with the collection.
   */
  collectionProductVariants?: {
    /**
     * A globally unique identifier for the item.
     */
    id?: string
    /**
     * Identifier for the variant of the product
     */
    variantId?: string
    /**
     * The location of the image as a URL.
     */
    imageSrc?: string
    /**
     * The price of the product variant.
     */
    priceAmount?: number
    /**
     * The SKU (stock keeping unit) associated with the variant.
     */
    sku?: string
    /**
     * The product variant's title.
     */
    title?: string
    /**
     * The product variant's untranslated title.
     */
    untranslatedTitle?: string
    /**
     * The product's vendor name.
     */
    vendor?: string
    /**
     * The product type specified by the merchant.
     */
    type?: string
    /**
     * The relative URL of the product.
     */
    url?: string
  }[]
  /**
   * The id attribute of an element.
   */
  id?: string
  /**
   * The action attribute of a form element.
   */
  action?: string
  /**
   * A list of elements associated with the form.
   */
  elements?: {
    /**
     * The id attribute of an element.
     */
    id?: string
    /**
     * The name attribute of an element.
     */
    name?: string
    /**
     * A string representation of the tag of an element.
     */
    tagName?: string
    /**
     * The type attribute of an element. Often relevant for an input or button element.
     */
    type?: string
    /**
     * The value attribute of an element. Often relevant for an input element.
     */
    value?: string
  }[]
  /**
   * Product Variant details
   */
  productVariant?: {
    /**
     * A globally unique identifier for the item.
     */
    id?: string
    /**
     * Identifier for the variant of the product
     */
    variantId?: string
    /**
     * The location of the image as a URL.
     */
    imageSrc?: string
    /**
     * The price of the product variant.
     */
    priceAmount?: number
    /**
     * The SKU (stock keeping unit) associated with the variant.
     */
    sku?: string
    /**
     * The product variant's title.
     */
    title?: string
    /**
     * The product variant's untranslated title.
     */
    untranslatedTitle?: string
    /**
     * The product's vendor name.
     */
    vendor?: string
    /**
     * The product type specified by the merchant.
     */
    type?: string
    /**
     * The relative URL of the product.
     */
    url?: string
  }
  /**
   * Search results details
   */
  searchResults?: {
    /**
     * A globally unique identifier for the item.
     */
    id?: string
    /**
     * Identifier for the variant of the product
     */
    variantId?: string
    /**
     * The location of the image as a URL.
     */
    imageSrc?: string
    /**
     * The price of the product variant.
     */
    priceAmount?: number
    /**
     * The SKU (stock keeping unit) associated with the variant.
     */
    sku?: string
    /**
     * The product variant's title.
     */
    title?: string
    /**
     * The product variant's untranslated title.
     */
    untranslatedTitle?: string
    /**
     * The product's vendor name.
     */
    vendor?: string
    /**
     * The product type specified by the merchant.
     */
    type?: string
    /**
     * The relative URL of the product.
     */
    url?: string
  }[]
  /**
   * The search query that was executed.
   */
  query?: string
}
