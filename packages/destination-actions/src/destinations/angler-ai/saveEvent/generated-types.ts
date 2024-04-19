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
   * Structured data related to the event.
   */
  data?: {
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
       * The estimated costs that the customer will pay at checkout.
       */
      cost?: {
        /**
         * A monetary value with currency.
         */
        totalAmount?: {
          /**
           * Decimal money amount.
           */
          amount?: number
          /**
           * Currency of the money.
           */
          currencyCode?: string
        }
      }
      /**
       * List of items in the cart.
       */
      lines?: {
        /**
         * The quantity of the merchandise that the customer intends to purchase.
         */
        quantity?: number
        /**
         * Cost of the merchandise line that the buyer will pay at checkout.
         */
        cost?: {
          /**
           * A monetary value with currency.
           */
          totalAmount?: {
            /**
             * Decimal money amount.
             */
            amount?: number
            /**
             * Currency of the money.
             */
            currencyCode?: string
          }
        }
        /**
         * Product variant of the line item.
         */
        merchandise?: {
          /**
           * A globally unique identifier.
           */
          id?: string
          /**
           * Image associated with the product variant. This field falls back to the product image if no image is available.
           */
          image?: {
            /**
             * The location of the image as a URL.
             */
            src?: string
          }
          /**
           * A monetary value with currency.
           */
          price?: {
            /**
             * Decimal money amount.
             */
            amount?: number
            /**
             * Currency of the money.
             */
            currencyCode?: string
          }
          /**
           * The product object that the product variant belongs to.
           */
          product?: {
            /**
             * The ID of the product.
             */
            id?: string
            /**
             * The product's title.
             */
            title?: string
            /**
             * The product's untranslated title.
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
        }
      }[]
    }
    /**
     * Represents information about a single line item in the shopping cart.
     */
    cartLine?: {
      /**
       * The quantity of the merchandise that the customer intends to purchase.
       */
      quantity?: number
      /**
       * Cost of the merchandise line that the buyer will pay at checkout.
       */
      cost?: {
        /**
         * A monetary value with currency.
         */
        totalAmount?: {
          /**
           * Decimal money amount.
           */
          amount?: number
          /**
           * Currency of the money.
           */
          currencyCode?: string
        }
      }
      /**
       * Product variant of the line item.
       */
      merchandise?: {
        /**
         * A globally unique identifier.
         */
        id?: string
        /**
         * Image associated with the product variant. This field falls back to the product image if no image is available.
         */
        image?: {
          /**
           * The location of the image as a URL.
           */
          src?: string
        }
        /**
         * A monetary value with currency.
         */
        price?: {
          /**
           * Decimal money amount.
           */
          amount?: number
          /**
           * Currency of the money.
           */
          currencyCode?: string
        }
        /**
         * The product object that the product variant belongs to.
         */
        product?: {
          /**
           * The ID of the product.
           */
          id?: string
          /**
           * The product's title.
           */
          title?: string
          /**
           * The product's untranslated title.
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
      }
    }
    /**
     * Information about the checkout process.
     */
    checkout?: {
      /**
       * A list of attributes accumulated throughout the checkout process.
       */
      attributes?: {
        /**
         * The key identifier for the attribute.
         */
        key: string
        /**
         * The value of the attribute.
         */
        value?: string
      }[]
      /**
       * Billing address information.
       */
      billingAddress?: {
        /**
         * The first line of the address. This is usually the street address or a P.O. Box number.
         */
        address1?: string
        /**
         * The second line of the address. This is usually an apartment, suite, or unit number.
         */
        address2?: string
        /**
         * The name of the city, district, village, or town.
         */
        city?: string
        /**
         * The name of the country.
         */
        country?: string
        /**
         * The two-letter code that represents the country, for example, US. The country codes generally follow ISO 3166-1 alpha-2 guidelines.
         */
        countryCode?: string
        /**
         * The customer's first name.
         */
        firstName?: string
        /**
         * The customer's last name.
         */
        lastName?: string
        /**
         * The phone number for this mailing address as entered by the customer.
         */
        phone?: string
        /**
         * The region of the address, such as the province, state, or district.
         */
        province?: string
        /**
         * The two-letter code for the region. For example, ON.
         */
        provinceCode?: string
        /**
         * The ZIP or postal code of the address.
         */
        zip?: string
      }
      /**
       * The three-letter code that represents the currency, for example, USD. Supported codes include standard ISO 4217 codes, legacy codes, and non-standard codes.
       */
      currencyCode?: string
      /**
       * A list of discount applications.
       */
      discountApplications?: {
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
         * The value of the discount application.
         */
        value?: {
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
        }
      }[]
      /**
       * The email attached to this checkout.
       */
      email?: string
      /**
       * A list of line item objects, each one containing information about an item in the checkout.
       */
      lineItems?: {
        /**
         * A list of discount applications that are applicable to this line item.
         */
        discountAllocations?: {
          /**
           * The amount of the discount allocated to the line item.
           */
          amount?: {
            /**
             * Decimal money amount.
             */
            amount?: number
            /**
             * Currency of the money.
             */
            currencyCode?: string
          }
          /**
           * Discount applications capture the intentions of a discount source at the time of application.
           */
          discountApplication?: {
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
             * The value of the discount application.
             */
            value?: {
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
            }
          }
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
         * Product variant of the line item.
         */
        variant?: {
          /**
           * A globally unique identifier.
           */
          id?: string
          /**
           * Image associated with the product variant. This field falls back to the product image if no image is available.
           */
          image?: {
            /**
             * The location of the image as a URL.
             */
            src?: string
          }
          /**
           * A monetary value with currency.
           */
          price?: {
            /**
             * Decimal money amount.
             */
            amount?: number
            /**
             * Currency of the money.
             */
            currencyCode?: string
          }
          /**
           * The product object that the product variant belongs to.
           */
          product?: {
            /**
             * The ID of the product.
             */
            id?: string
            /**
             * The product's title.
             */
            title?: string
            /**
             * The product's untranslated title.
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
        }
      }[]
      /**
       * The order object associated with this checkout.
       */
      order?: {
        /**
         * The ID of the order.
         */
        id?: string
      }
      /**
       * A unique phone number for the customer.
       */
      phone?: string
      /**
       * An address.
       */
      shippingAddress?: {
        /**
         * The first line of the address. This is usually the street address or a P.O. Box number.
         */
        address1?: string
        /**
         * The second line of the address. This is usually an apartment, suite, or unit number.
         */
        address2?: string
        /**
         * The name of the city, district, village, or town.
         */
        city?: string
        /**
         * The name of the country.
         */
        country?: string
        /**
         * The two-letter code that represents the country, for example, US. The country codes generally follow ISO 3166-1 alpha-2 guidelines.
         */
        countryCode?: string
        /**
         * The customer's first name.
         */
        firstName?: string
        /**
         * The customer's last name.
         */
        lastName?: string
        /**
         * The phone number for this mailing address as entered by the customer.
         */
        phone?: string
        /**
         * The region of the address, such as the province, state, or district.
         */
        province?: string
        /**
         * The two-letter code for the region. For example, ON.
         */
        provinceCode?: string
        /**
         * The ZIP or postal code of the address.
         */
        zip?: string
      }
      /**
       * A shipping line object.
       */
      shippingLine?: {
        /**
         * A monetary value with currency.
         */
        price?: {
          /**
           * Decimal money amount.
           */
          amount?: number
          /**
           * Currency of the money.
           */
          currencyCode?: string
        }
      }
      /**
       * A monetary value with currency.
       */
      subtotalPrice?: {
        /**
         * Decimal money amount.
         */
        amount?: number
        /**
         * Currency of the money.
         */
        currencyCode?: string
      }
      /**
       * A unique identifier for a particular checkout.
       */
      token?: string
      /**
       * A monetary value with currency.
       */
      totalPrice?: {
        /**
         * Decimal money amount.
         */
        amount?: number
        /**
         * Currency of the money.
         */
        currencyCode?: string
      }
      /**
       * A monetary value with currency.
       */
      totalTax?: {
        /**
         * Decimal money amount.
         */
        amount?: number
        /**
         * Currency of the money.
         */
        currencyCode?: string
      }
    }
    collection?: {
      /**
       * A globally unique identifier.
       */
      id?: string
      /**
       * The collection's name.
       */
      title?: string
      /**
       * Product variant of the line item.
       */
      productVariants?: {
        /**
         * A globally unique identifier.
         */
        id?: string
        /**
         * Image associated with the product variant. This field falls back to the product image if no image is available.
         */
        image?: {
          /**
           * The location of the image as a URL.
           */
          src?: string
        }
        /**
         * A monetary value with currency.
         */
        price?: {
          /**
           * Decimal money amount.
           */
          amount?: number
          /**
           * Currency of the money.
           */
          currencyCode?: string
        }
        /**
         * The product object that the product variant belongs to.
         */
        product?: {
          /**
           * The ID of the product.
           */
          id?: string
          /**
           * The product's title.
           */
          title?: string
          /**
           * The product's untranslated title.
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
      }[]
    }
    /**
     * Product variant of the line item
     */
    productVariant?: {
      /**
       * A globally unique identifier.
       */
      id?: string
      /**
       * Image associated with the product variant. This field falls back to the product image if no image is available.
       */
      image?: {
        /**
         * The location of the image as a URL.
         */
        src?: string
      }
      /**
       * A monetary value with currency.
       */
      price?: {
        /**
         * Decimal money amount.
         */
        amount?: number
        /**
         * Currency of the money.
         */
        currencyCode?: string
      }
      /**
       * The product object that the product variant belongs to.
       */
      product?: {
        /**
         * The ID of the product.
         */
        id?: string
        /**
         * The product's title.
         */
        title?: string
        /**
         * The product's untranslated title.
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
    }
    searchResult?: {
      /**
       * The search query that was executed.
       */
      query?: string
      /**
       * Product variant of the line item.
       */
      productVariants?: {
        /**
         * A globally unique identifier.
         */
        id?: string
        /**
         * Image associated with the product variant. This field falls back to the product image if no image is available.
         */
        image?: {
          /**
           * The location of the image as a URL.
           */
          src?: string
        }
        /**
         * A monetary value with currency.
         */
        price?: {
          /**
           * Decimal money amount.
           */
          amount?: number
          /**
           * Currency of the money.
           */
          currencyCode?: string
        }
        /**
         * The product object that the product variant belongs to.
         */
        product?: {
          /**
           * The ID of the product.
           */
          id?: string
          /**
           * The product's title.
           */
          title?: string
          /**
           * The product's untranslated title.
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
      }[]
    }
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
    }
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
}
