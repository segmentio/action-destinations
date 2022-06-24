import { IntegrationError } from '@segment/actions-core'
import { CURRENCY_ISO_CODES } from './constants'
import { ProductItem, PromotionProductItem } from './ga4-types'

// Google expects currency to be a 3-letter ISO 4217 format
export function verifyCurrency(currency: string): void {
  if (!CURRENCY_ISO_CODES.includes(currency.toUpperCase())) {
    throw new IntegrationError(`${currency} is not a valid currency code.`, 'Incorrect value format', 400)
  }
}

// Google expects timestamps to be in Unix microseconds
export function convertTimestamp(timestamp: string | undefined): number | undefined {
  if (!timestamp) {
    return undefined
  }

  // verify that timestamp is not already in unix
  if (!isNaN(+timestamp)) {
    return +timestamp
  }

  // converts non-unix timestamp to unix microseconds
  return Date.parse(timestamp) * 1000
}

export function formatItems(items: ProductItem[] | PromotionProductItem[] | undefined): ProductItem[] | undefined {
  if (!items) {
    return undefined
  }
  // let googleItems: ProductItem[] = []
  const googleItems = items.map((product) => {
    if (product.item_name === undefined && product.item_id === undefined) {
      throw new IntegrationError(
        'One of product name or product id is required for product or impression data.',
        'Misconfigured required field',
        400
      )
    }
    if (product.currency) {
      verifyCurrency(product.currency)
    }
    return product
  })

  return googleItems
}
