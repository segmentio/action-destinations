import { Payload } from './generated-types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isNotEmpty(obj: Record<string, any> | undefined): obj is Record<string, any> {
  if (typeof obj === 'object' && obj !== null && Object.keys(obj).length > 0) return true

  return false
}

export function transformPayload(payload: Payload) {
  const dataObject = {
    ...(isNotEmpty(payload.cart)
      ? {
          cart: {
            cost: {
              totalAmount: {
                amount: payload.cart.totalAmount,
                currencyCode: payload.cart.currencyCode
              }
            },
            id: payload.cart.id,
            ...(payload.cartLines
              ? {
                  lines: payload.cartLines.map((cartLine) => ({
                    cost: {
                      totalAmount: {
                        amount: cartLine.itemCost,
                        currencyCode: cartLine.itemCurrencyCode
                      }
                    },
                    merchandise: {
                      id: cartLine.merchandiseId,
                      image: {
                        src: cartLine.merchandiseImageSrc
                      },
                      price: {
                        amount: cartLine.merchandisePriceAmount,
                        currencyCode: cartLine.merchandisePriceCurrencyCode
                      },
                      product: {
                        id: cartLine.merchandiseProductId,
                        title: cartLine.merchandiseProductTitle,
                        untranslatedTitle: cartLine.merchandiseProductUntranslatedTitle,
                        vendor: cartLine.merchandiseProductVendor,
                        type: cartLine.merchandiseProductType,
                        url: cartLine.merchandiseProductUrl
                      },
                      sku: cartLine.merchandiseSku,
                      title: cartLine.merchandiseTitle,
                      untranslatedTitle: cartLine.merchandiseUntranslatedTitle
                    },
                    quantity: cartLine.quantity
                  }))
                }
              : {}),
            totalQuantity: payload.cart.totalQuantity
          }
        }
      : {}),
    ...(isNotEmpty(payload.cartLine)
      ? {
          cartLine: {
            cost: {
              totalAmount: {
                amount: payload.cartLine.itemCost,
                currencyCode: payload.cartLine.itemCurrencyCode
              }
            },
            merchandise: {
              id: payload.cartLine.merchandiseId,
              image: {
                src: payload.cartLine.merchandiseImageSrc
              },
              price: {
                amount: payload.cartLine.merchandisePriceAmount,
                currencyCode: payload.cartLine.merchandisePriceCurrencyCode
              },
              product: {
                id: payload.cartLine.merchandiseProductId,
                title: payload.cartLine.merchandiseProductTitle,
                untranslatedTitle: payload.cartLine.merchandiseProductUntranslatedTitle,
                vendor: payload.cartLine.merchandiseProductVendor,
                type: payload.cartLine.merchandiseProductType,
                url: payload.cartLine.merchandiseProductUrl
              },
              sku: payload.cartLine.merchandiseSku,
              title: payload.cartLine.merchandiseTitle,
              untranslatedTitle: payload.cartLine.merchandiseUntranslatedTitle
            },
            quantity: payload.cartLine.quantity
          }
        }
      : {}),
    ...(isNotEmpty(payload.checkout)
      ? {
          checkout: {
            attributes: payload.checkoutAttributes,
            billingAddress: {
              address1: payload.checkout.billingAddress1,
              address2: payload.checkout.billingAddress2,
              city: payload.checkout.billingCity,
              country: payload.checkout.billingCountry,
              countryCode: payload.checkout.billingCountryCode,
              firstName: payload.checkout.billingFirstName,
              lastName: payload.checkout.billingLastName,
              phone: payload.checkout.billingPhone,
              province: payload.checkout.billingProvince,
              provinceCode: payload.checkout.billingProvinceCode,
              zip: payload.checkout.billingZip
            },
            currencyCode: payload.checkout.currencyCode,
            ...(payload.checkoutDiscountApplications
              ? {
                  discountApplications: payload.checkoutDiscountApplications.map((discountApplication) => ({
                    allocationMethod: discountApplication.allocationMethod,
                    targetSelection: discountApplication.targetSelection,
                    targetType: discountApplication.targetType,
                    title: discountApplication.title,
                    type: discountApplication.type,
                    value: {
                      amount: discountApplication.amount,
                      currencyCode: discountApplication.currencyCode,
                      percentage: discountApplication.percentage
                    }
                  }))
                }
              : {}),
            email: payload.checkout.email,
            ...(payload.checkoutLineItems
              ? {
                  lineItems: payload.checkoutLineItems.map((lineItem) => ({
                    ...(lineItem.discountAllocations
                      ? {
                          discountAllocations: lineItem.discountAllocations.map((discountAllocation) => ({
                            amount: discountAllocation.amount,
                            currencyCode: discountAllocation.currencyCode,
                            discountApplication: {
                              allocationMethod: discountAllocation.allocationMethod,
                              targetSelection: discountAllocation.targetSelection,
                              targetType: discountAllocation.targetType,
                              title: discountAllocation.title,
                              type: discountAllocation.type,
                              value: {
                                amount: discountAllocation.amount,
                                currencyCode: discountAllocation.currencyCode,
                                percentage: discountAllocation.percentage
                              }
                            }
                          }))
                        }
                      : {}),
                    id: lineItem.id,
                    quantity: lineItem.quantity,
                    title: lineItem.title,
                    variant: {
                      id: lineItem.productVariantId,
                      image: {
                        src: lineItem.productVariantImageSrc
                      },
                      price: {
                        amount: lineItem.productVariantPriceAmount,
                        currencyCode: lineItem.productVariantPriceCurrencyCode
                      },
                      product: {
                        id: lineItem.productVariantProductId,
                        title: lineItem.productVariantProductTitle,
                        untranslatedTitle: lineItem.productVariantUntranslatedTitle,
                        vendor: lineItem.productVariantProductVendor,
                        type: lineItem.productVariantProductType,
                        url: lineItem.productVariantProductUrl
                      },
                      sku: lineItem.productVariantSku,
                      title: lineItem.productVariantTitle,
                      untranslatedTitle: lineItem.productVariantUntranslatedTitle
                    }
                  }))
                }
              : {}),
            order: {
              id: payload.checkout.orderId
            },
            phone: payload.checkout.phone,
            shippingAddress: {
              address1: payload.checkout.shippingAddress1,
              address2: payload.checkout.shippingAddress2,
              city: payload.checkout.shippingCity,
              country: payload.checkout.shippingCountry,
              countryCode: payload.checkout.shippingCountryCode,
              firstName: payload.checkout.shippingFirstName,
              lastName: payload.checkout.shippingLastName,
              phone: payload.checkout.shippingPhone,
              province: payload.checkout.shippingProvince,
              provinceCode: payload.checkout.shippingProvinceCode,
              zip: payload.checkout.shippingZip
            },
            shippingLine: {
              price: {
                amount: payload.checkout.shippingLinePriceAmount,
                currencyCode: payload.checkout.shippingLinePriceCurrencyCode
              }
            },
            subtotalPrice: {
              amount: payload.checkout.subtotalPriceAmount,
              currencyCode: payload.checkout.subtotalPriceCurrencyCode
            },
            token: payload.checkout.token,
            totalPrice: {
              amount: payload.checkout.totalPriceAmount,
              currencyCode: payload.checkout.totalPriceCurrencyCode
            },
            totalTax: {
              amount: payload.checkout.totalTaxAmount,
              currencyCode: payload.checkout.totalTaxCurrencyCode
            }
          }
        }
      : {}),
    ...(isNotEmpty(payload.collection)
      ? {
          collection: {
            id: payload.collection.id,
            title: payload.collection.title,
            ...(payload.collectionProductVariants
              ? {
                  productVariants: payload.collectionProductVariants.map((productVariant) => ({
                    id: productVariant.id,
                    image: {
                      src: productVariant.imageSrc
                    },
                    price: {
                      amount: productVariant.priceAmount,
                      currencyCode: productVariant.priceCurrencyCode
                    },
                    product: {
                      id: productVariant.productId,
                      title: productVariant.productTitle,
                      untranslatedTitle: productVariant.productUntranslatedTitle,
                      vendor: productVariant.productVendor,
                      type: productVariant.productType,
                      url: productVariant.productUrl
                    },
                    sku: productVariant.sku,
                    title: productVariant.title,
                    untranslatedTitle: productVariant.untranslatedTitle
                  }))
                }
              : {})
          }
        }
      : {}),
    ...(isNotEmpty(payload.productVariant)
      ? {
          productVariant: {
            id: payload.productVariant.id,
            image: {
              src: payload.productVariant.imageSrc
            },
            price: {
              amount: payload.productVariant.priceAmount,
              currencyCode: payload.productVariant.priceCurrencyCode
            },
            product: {
              id: payload.productVariant.productId,
              title: payload.productVariant.productTitle,
              untranslatedTitle: payload.productVariant.productUntranslatedTitle,
              vendor: payload.productVariant.productVendor,
              type: payload.productVariant.productType,
              url: payload.productVariant.productUrl
            },
            sku: payload.productVariant.sku,
            title: payload.productVariant.title,
            untranslatedTitle: payload.productVariant.untranslatedTitle
          }
        }
      : {}),
    ...(payload.searchQuery && payload.searchResultProductVariants
      ? {
          searchResult: {
            query: payload.searchQuery,
            productVariants: payload.searchResultProductVariants.map((productVariant) => ({
              id: productVariant.id,
              image: {
                src: productVariant.imageSrc
              },
              price: {
                amount: productVariant.priceAmount,
                currencyCode: productVariant.priceCurrencyCode
              },
              product: {
                id: productVariant.productId,
                title: productVariant.productTitle,
                untranslatedTitle: productVariant.productUntranslatedTitle,
                vendor: productVariant.productVendor,
                type: productVariant.productType,
                url: productVariant.productUrl
              },
              sku: productVariant.sku,
              title: productVariant.title,
              untranslatedTitle: productVariant.untranslatedTitle
            }))
          }
        }
      : {}),
    ...(isNotEmpty(payload.customer)
      ? {
          customer: {
            id: payload.customer.id,
            email: payload.customer.email,
            firstName: payload.customer.firstName,
            lastName: payload.customer.lastName,
            ordersCount: payload.customer.ordersCount,
            phone: payload.customer.phone,
            dob: payload.customer.dob
          }
        }
      : {}),
    ...(isNotEmpty(payload.form)
      ? {
          form: {
            id: payload.form.id,
            action: payload.form.action,
            ...(payload.formElements
              ? {
                  elements: payload.formElements.map((element) => ({
                    id: element.id,
                    name: element.name,
                    tagName: element.tagName,
                    type: element.type,
                    value: element.value
                  }))
                }
              : {})
          }
        }
      : {}),
    ...(isNotEmpty(payload.contacts)
      ? {
          contacts: payload.contacts.map((contact) => ({
            id: contact.id,
            email: contact.email,
            firstName: contact.firstName,
            lastName: contact.lastName,
            ordersCount: contact.ordersCount,
            phone: contact.phone,
            dob: contact.dob
          }))
        }
      : {}),
    ...(isNotEmpty(payload.customData)
      ? {
          customData: payload.customData.map((customData) => ({
            name: customData.name,
            value: customData.value
          }))
        }
      : {})
  }

  // delete all the properties that were used to create the data object
  const propertiesToDelete: Array<keyof Payload> = [
    'cartLine',
    'cartLines',
    'cart',
    'checkoutAttributes',
    'checkoutDiscountApplications',
    'checkoutLineItems',
    'checkout',
    'collectionProductVariants',
    'collection',
    'contacts',
    'customData',
    'customer',
    'formElements',
    'form',
    'productVariant',
    'searchQuery',
    'searchResultProductVariants'
  ]
  propertiesToDelete.forEach((property) => {
    delete payload[property]
  })

  return {
    ...payload,
    data: dataObject
  }
}
