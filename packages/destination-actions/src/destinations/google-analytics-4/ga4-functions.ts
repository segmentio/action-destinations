import { IntegrationError } from '@segment/actions-core'
import { CURRENCY_ISO_CODES } from './constants'
import { ProductItem, PromotionProductItem } from './ga4-types'

// Google expects currency to be a 3-letter ISO 4217 format
export function verifyCurrency(currency: string): void {
  if (!CURRENCY_ISO_CODES.includes(currency.toUpperCase())) {
    throw new IntegrationError(`${currency} is not a valid currency code.`, 'Incorrect value format', 400)
  }
}

export function checkCurrencyDefinition(
  value: number | undefined,
  eventCurrency: string | undefined,
  items: ProductItem[] | undefined
): void {
  // Google requires that currency be included at the event level if value is included.
  if (value && eventCurrency === undefined) {
    throw new IntegrationError('Currency is required if value is set.', 'Misconfigured required field', 400)
  }

  /**
   * Google requires a currency be specified either at the event level or the item level.
   * If set at the event level, item-level currency is ignored. If event-level currency is not set then
   * currency from the first item in items is used.
   */
  if (eventCurrency === undefined && (!items || !items[0] || !items[0].currency)) {
    throw new IntegrationError(
      'One of item-level currency or top-level currency is required.',
      'Misconfigured required field',
      400
    )
  }
}

export function formatItems(items: ProductItem[]): ProductItem[] {
  let googleItems: ProductItem[] = []
  googleItems = items.map((product) => {
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

export function formatPromotionItems(items: PromotionProductItem[]): PromotionProductItem[] {
  let googleItems: PromotionProductItem[] = []
  googleItems = items.map((product) => {
    if (product.item_name === undefined && product.item_id === undefined) {
      throw new IntegrationError(
        'One of product name or product id is required for product or impression data.',
        'Misconfigured required field',
        400
      )
    }
    if (product.promotion_id === undefined && product.promotion_name === undefined) {
      throw new IntegrationError(
        'One of promotion name or promotion id is required.',
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
