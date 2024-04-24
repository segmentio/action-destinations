// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * A unique event identifier.
   */
  event_id?: string
  /**
   * The name of your event
   */
  event_name?: string
  /**
   * Additional name for custom events if 'event_name' is 'custom_event'.
   */
  custom_event_name?: string
  /**
   * The IP address of the user.
   */
  ip_address?: string
  /**
   * The user agent of the device sending the event.
   */
  user_agent?: string
  /**
   * The timestamp when the event was triggered.
   */
  timestamp?: string
  /**
   * Facebook Pixel ID.
   */
  fbp?: string
  /**
   * Facebook Click ID.
   */
  fbc?: string
  /**
   * Google Analytics ID.
   */
  ga?: string
  /**
   * Additional identifiers related to the event.
   */
  identifiers?: {
    /**
     * Name of the identifier.
     */
    name?: string
    /**
     * Value of the identifier.
     */
    value?: string
  }[]
  /**
   * The URL where the event occurred.
   */
  url?: string
  /**
   * A unique client/browser identifier. ga or fbp cookie value will be used if this value is not provided.
   */
  client_id?: string
  /**
   * The referring URL if applicable.
   */
  referrer?: string
  /**
   * Details of the shopping cart.
   */
  cart?: {
    /**
     * A globally unique identifier for the cart.
     */
    id?: string
    /**
     * The total number of items in the cart.
     */
    totalQuantity?: number
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
   * List of items in the cart.
   */
  cartLines?: {
    /**
     * The quantity of the merchandise that the customer intends to purchase.
     */
    quantity?: number
    /**
     * The cost of the merchandise line that the buyer will pay at checkout.
     */
    itemCost?: number
    /**
     * Currency of the money.
     */
    itemCurrencyCode?: string
    /**
     * A globally unique identifier.
     */
    merchandiseId?: string
    /**
     * The location of the image as a URL.
     */
    merchandiseImageSrc?: string
    /**
     * The price of the product variant.
     */
    merchandisePriceAmount?: number
    /**
     * The currency code of the price.
     */
    merchandisePriceCurrencyCode?: string
    /**
     * The SKU (stock keeping unit) associated with the variant.
     */
    merchandiseSku?: string
    /**
     * The product variant's title.
     */
    merchandiseTitle?: string
    /**
     * The product variant's untranslated title.
     */
    merchandiseUntranslatedTitle?: string
    /**
     * The ID of the product.
     */
    merchandiseProductId?: string
    /**
     * The product's title.
     */
    merchandiseProductTitle?: string
    /**
     * The product's untranslated title.
     */
    merchandiseProductUntranslatedTitle?: string
    /**
     * The product's vendor name.
     */
    merchandiseProductVendor?: string
    /**
     * The product type specified by the merchant.
     */
    merchandiseProductType?: string
    /**
     * The relative URL of the product.
     */
    merchandiseProductUrl?: string
  }[]
  /**
   * Represents information about a single line item in the shopping cart.
   */
  cartLine?: {
    /**
     * The quantity of the merchandise that the customer intends to purchase.
     */
    quantity?: number
    /**
     * The cost of the merchandise line that the buyer will pay at checkout.
     */
    itemCost?: number
    /**
     * Currency of the money.
     */
    itemCurrencyCode?: string
    /**
     * A globally unique identifier.
     */
    merchandiseId?: string
    /**
     * The location of the image as a URL.
     */
    merchandiseImageSrc?: string
    /**
     * The price of the product variant.
     */
    merchandisePriceAmount?: number
    /**
     * The currency code of the price.
     */
    merchandisePriceCurrencyCode?: string
    /**
     * The SKU (stock keeping unit) associated with the variant.
     */
    merchandiseSku?: string
    /**
     * The product variant's title.
     */
    merchandiseTitle?: string
    /**
     * The product variant's untranslated title.
     */
    merchandiseUntranslatedTitle?: string
    /**
     * The ID of the product.
     */
    merchandiseProductId?: string
    /**
     * The product's title.
     */
    merchandiseProductTitle?: string
    /**
     * The product's untranslated title.
     */
    merchandiseProductUntranslatedTitle?: string
    /**
     * The product's vendor name.
     */
    merchandiseProductVendor?: string
    /**
     * The product type specified by the merchant.
     */
    merchandiseProductType?: string
    /**
     * The relative URL of the product.
     */
    merchandiseProductUrl?: string
  }
  /**
   * Information about the checkout process.
   */
  checkout?: {
    /**
     * The first line of the address. This is usually the street address or a P.O. Box number.
     */
    billingAddress1?: string
    /**
     * The second line of the address. This is usually an apartment, suite, or unit number.
     */
    billingAddress2?: string
    /**
     * The name of the city, district, village, or town.
     */
    billingCity?: string
    /**
     * The name of the country.
     */
    billingCountry?: string
    /**
     * The two-letter code that represents the country, for example, US. The country codes generally follow ISO 3166-1 alpha-2 guidelines.
     */
    billingCountryCode?: string
    /**
     * The customer's first name.
     */
    billingFirstName?: string
    /**
     * The customer's last name.
     */
    billingLastName?: string
    /**
     * The phone number for this mailing address as entered by the customer.
     */
    billingPhone?: string
    /**
     * The region of the address, such as the province, state, or district.
     */
    billingProvince?: string
    /**
     * The two-letter code for the region. For example, ON.
     */
    billingProvinceCode?: string
    /**
     * The ZIP or postal code of the address.
     */
    billingZip?: string
    /**
     * The three-letter code that represents the currency, for example, USD. Supported codes include standard ISO 4217 codes, legacy codes, and non-standard codes.
     */
    currencyCode?: string
    /**
     * The email attached to this checkout.
     */
    email?: string
    /**
     * The ID of the order associated with this checkout.
     */
    orderId?: string
    /**
     * A unique phone number for the customer.
     */
    phone?: string
    /**
     * The first line of the address. This is usually the street address or a P.O. Box number.
     */
    shippingAddress1?: string
    /**
     * The second line of the address. This is usually an apartment, suite, or unit number.
     */
    shippingAddress2?: string
    /**
     * The name of the city, district, village, or town.
     */
    shippingCity?: string
    /**
     * The name of the country.
     */
    shippingCountry?: string
    /**
     * The two-letter code that represents the country, for example, US. The country codes generally follow ISO 3166-1 alpha-2 guidelines.
     */
    shippingCountryCode?: string
    /**
     * The customer's first name.
     */
    shippingFirstName?: string
    /**
     * The customer's last name.
     */
    shippingLastName?: string
    /**
     * The phone number for this mailing address as entered by the customer.
     */
    shippingPhone?: string
    /**
     * The region of the address, such as the province, state, or district.
     */
    shippingProvince?: string
    /**
     * The two-letter code for the region. For example, ON.
     */
    shippingProvinceCode?: string
    /**
     * The ZIP or postal code of the address.
     */
    shippingZip?: string
    /**
     * A monetary value.
     */
    shippingLinePriceAmount?: number
    /**
     * The currency code of the money.
     */
    shippingLinePriceCurrencyCode?: string
    /**
     * A monetary value.
     */
    subtotalPriceAmount?: number
    /**
     * The currency code of the money.
     */
    subtotalPriceCurrencyCode?: string
    /**
     * A unique identifier for a particular checkout.
     */
    token?: string
    /**
     * A monetary value.
     */
    totalPriceAmount?: number
    /**
     * The currency code of the money.
     */
    totalPriceCurrencyCode?: string
    /**
     * A monetary value with currency.
     */
    totalTaxAmount?: number
    /**
     * The currency code of the money.
     */
    totalTaxCurrencyCode?: string
  }
  /**
   * A list of discount applications associated with the checkout.
   */
  checkoutDiscountApplications?: {
    /**
     * The method by which the discount's value is applied to its entitled items.
     */
    allocationMethod?: string
    /**
     * How the discount amount is distributed on the discounted lines.
     */
    targetSelection?: string
    /**
     * The type of line (i.e. line item or shipping line) on an order that the discount is applicable towards.
     */
    targetType?: string
    /**
     * The customer-facing name of the discount. If the type of discount is a DISCOUNT_CODE, this title attribute represents the code of the discount.
     */
    title?: string
    /**
     * The type of discount.
     */
    type?: string
    /**
     * Decimal money amount.
     */
    amount?: number
    /**
     * Currency of the money.
     */
    currencyCode?: string
    /**
     * The percentage value of the discount application.
     */
    percentage?: number
  }[]
  /**
   * A list of line item objects, each one containing information about an item in the checkout.
   */
  checkoutLineItems?: {
    /**
     * The discounts that have been applied to the checkout line item by a discount application.
     */
    discountAllocations?: {
      /**
       * Decimal money amount.
       */
      amount?: number
      /**
       * Currency of the money.
       */
      currencyCode?: string
      /**
       * The method by which the discount's value is applied to its entitled items.
       */
      allocationMethod?: string
      /**
       * How the discount amount is distributed on the discounted lines.
       */
      targetSelection?: string
      /**
       * The type of line (i.e. line item or shipping line) on an order that the discount is applicable towards.
       */
      targetType?: string
      /**
       * The customer-facing name of the discount. If the type of discount is a DISCOUNT_CODE, this title attribute represents the code of the discount.
       */
      title?: string
      /**
       * The type of discount.
       */
      type?: string
      /**
       * The percentage value of the discount application.
       */
      percentage?: number
    }[]
    /**
     * A globally unique identifier.
     */
    id?: string
    /**
     * The quantity of the line item.
     */
    quantity?: number
    /**
     * The title of the line item. Defaults to the product's title.
     */
    title?: string
    /**
     * A globally unique identifier.
     */
    productVariantId?: string
    /**
     * The location of the image as a URL.
     */
    productVariantImageSrc?: string
    /**
     * The price of the product variant.
     */
    productVariantPriceAmount?: number
    /**
     * The currency code of the price.
     */
    productVariantPriceCurrencyCode?: string
    /**
     * The SKU (stock keeping unit) associated with the variant.
     */
    productVariantSku?: string
    /**
     * The product variant's title.
     */
    productVariantTitle?: string
    /**
     * The product variant's untranslated title.
     */
    productVariantUntranslatedTitle?: string
    /**
     * The ID of the product.
     */
    productVariantProductId?: string
    /**
     * The product's title.
     */
    productVariantProductTitle?: string
    /**
     * The product's untranslated title.
     */
    productVariantProductUntranslatedTitle?: string
    /**
     * The product's vendor name.
     */
    productVariantProductVendor?: string
    /**
     * The product type specified by the merchant.
     */
    productVariantProductType?: string
    /**
     * The relative URL of the product.
     */
    productVariantProductUrl?: string
  }[]
  /**
   * A list of attributes accumulated throughout the checkout process.
   */
  checkoutAttributes?: {
    /**
     * The key of the attribute.
     */
    key?: string
    /**
     * The value of the attribute.
     */
    value?: string
  }[]
  collection?: {
    /**
     * A globally unique identifier.
     */
    id?: string
    /**
     * The collection's name.
     */
    title?: string
  }
  /**
   * A list of product variants associated with the collection.
   */
  collectionProductVariants?: {
    /**
     * A globally unique identifier.
     */
    id?: string
    /**
     * The location of the image as a URL.
     */
    imageSrc?: string
    /**
     * The price of the product variant.
     */
    priceAmount?: number
    /**
     * The currency code of the price.
     */
    priceCurrencyCode?: string
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
     * The ID of the product.
     */
    productId?: string
    /**
     * The product's title.
     */
    productTitle?: string
    /**
     * The product's untranslated title.
     */
    productUntranslatedTitle?: string
    /**
     * The product's vendor name.
     */
    productVendor?: string
    /**
     * The product type specified by the merchant.
     */
    productType?: string
    /**
     * The relative URL of the product.
     */
    productUrl?: string
  }[]
  /**
   * Product variant of the line item
   */
  productVariant?: {
    /**
     * A globally unique identifier.
     */
    id?: string
    /**
     * The location of the image as a URL.
     */
    imageSrc?: string
    /**
     * The price of the product variant.
     */
    priceAmount?: number
    /**
     * The currency code of the price.
     */
    priceCurrencyCode?: string
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
     * The ID of the product.
     */
    productId?: string
    /**
     * The product's title.
     */
    productTitle?: string
    /**
     * The product's untranslated title.
     */
    productUntranslatedTitle?: string
    /**
     * The product's vendor name.
     */
    productVendor?: string
    /**
     * The product type specified by the merchant.
     */
    productType?: string
    /**
     * The relative URL of the product.
     */
    productUrl?: string
  }
  /**
   * The search query that was executed.
   */
  searchQuery?: string
  /**
   * A list of product variants associated with the search result.
   */
  searchResultProductVariants?: {
    /**
     * A globally unique identifier.
     */
    id?: string
    /**
     * The location of the image as a URL.
     */
    imageSrc?: string
    /**
     * The price of the product variant.
     */
    priceAmount?: number
    /**
     * The currency code of the price.
     */
    priceCurrencyCode?: string
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
     * The ID of the product.
     */
    productId?: string
    /**
     * The product's title.
     */
    productTitle?: string
    /**
     * The product's untranslated title.
     */
    productUntranslatedTitle?: string
    /**
     * The product's vendor name.
     */
    productVendor?: string
    /**
     * The product type specified by the merchant.
     */
    productType?: string
    /**
     * The relative URL of the product.
     */
    productUrl?: string
  }[]
  customer?: {
    /**
     * A unique identifier for the customer.
     */
    id?: string
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
     * The number of orders associated with this customer.
     */
    ordersCount?: number
    /**
     * The unique phone number (E.164 format) for this customer.
     */
    phone?: string
    /**
     * The customer's date of birth.
     */
    dob?: string
  }
  form?: {
    /**
     * The id attribute of an element.
     */
    id?: string
    /**
     * The action attribute of a form element.
     */
    action?: string
  }
  /**
   * A list of elements associated with the form.
   */
  formElements?: {
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
  contacts?: {
    /**
     * A unique identifier for the customer.
     */
    id?: string
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
     * The number of orders associated with this customer.
     */
    ordersCount?: number
    /**
     * The unique phone number (E.164 format) for this customer.
     */
    phone?: string
    /**
     * The customer's date of birth.
     */
    dob?: string
  }[]
  customData?: {
    name?: string
    value?: string
  }[]
}
