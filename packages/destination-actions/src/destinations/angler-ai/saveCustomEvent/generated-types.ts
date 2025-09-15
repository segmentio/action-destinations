// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * A unique event identifier.
   */
  eventId: string
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
  identifiers: {
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
    clientId: string
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
   * Custom attributes for the event. Data should be specified as key:value pairs
   */
  customAttributes?: {
    [k: string]: unknown
  }
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
   * Cart details
   */
  cart?: {
    /**
     * A globally unique identifier for the cart.
     */
    id?: string
    /**
     * Decimal money amount.
     */
    totalAmount?: number
    /**
     * The currency code of the money.
     */
    currencyCode?: string
  }
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
   * Checkout details
   */
  checkout?: {
    /**
     * Decimal money amount.
     */
    totalAmount?: number
    /**
     * The currency code of the money.
     */
    currencyCode?: string
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
   * The billing address associated with the checkout.
   */
  checkoutBillingAddress?: {
    /**
     * The customer's mailing address.
     */
    address1?: string
    /**
     * An additional field for the customer's mailing address.
     */
    address2?: string
    /**
     * The customer's city, town, or village.
     */
    city?: string
    /**
     * The customer's country.
     */
    country?: string
    /**
     * The two-letter country code corresponding to the customer's country
     */
    country_code?: string
    /**
     * The customer's first name.
     */
    first_name?: string
    /**
     * The customer's last name.
     */
    last_name?: string
    /**
     * The customer's phone number at this address.
     */
    phone?: string
    /**
     * The customer's region name. Typically a province, a state, or a prefecture
     */
    province?: string
    /**
     * The code for the region of the address, such as the province, state, or district. For example QC for Quebec, Canada.
     */
    province_code?: string
    /**
     * The customer's postal code, also known as zip, postcode, Eircode, etc
     */
    zip?: string
  }
  /**
   * The address to which the order will be shipped.
   */
  checkoutShippingAddress?: {
    /**
     * The customer's mailing address.
     */
    address1?: string
    /**
     * An additional field for the customer's mailing address.
     */
    address2?: string
    /**
     * The customer's city, town, or village.
     */
    city?: string
    /**
     * The customer's country.
     */
    country?: string
    /**
     * The two-letter country code corresponding to the customer's country
     */
    country_code?: string
    /**
     * The customer's first name.
     */
    first_name?: string
    /**
     * The customer's last name.
     */
    last_name?: string
    /**
     * The customer's phone number at this address.
     */
    phone?: string
    /**
     * The customer's region name. Typically a province, a state, or a prefecture
     */
    province?: string
    /**
     * The code for the region of the address, such as the province, state, or district. For example QC for Quebec, Canada.
     */
    province_code?: string
    /**
     * The customer's postal code, also known as zip, postcode, Eircode, etc
     */
    zip?: string
  }
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
  /**
   * The name of the event to track.
   */
  eventName: string
  /**
   * Additional name for custom events if 'event_name' is 'custom_event'.
   */
  customEventName?: string
}
