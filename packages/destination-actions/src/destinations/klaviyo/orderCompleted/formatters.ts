import { Product } from './types'

function toTitleCase(str: string) {
  return (
    str
      // remove special characters and replace with space
      .replace(/[^a-zA-Z0-9]/g, ' ')
      // replace multiple spaces with single space
      .replace(/\s+/g, ' ')
      // split by space and title case each word
      .trim()
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join('')
  )
}

// Recursively capitalize all keys in an object up to two levels deep
// Array values are not modified.
// We do this because Klaviyo examples and classic destinations use title case for keys.
// https://developers.klaviyo.com/en/docs/guide_to_integrating_a_platform_without_a_pre_built_klaviyo_integration#placed-order
export function convertKeysToTitleCase(obj: Record<string, unknown>, level = 0): Record<string, unknown> {
  if (level > 1) return obj
  return Object.fromEntries(
    Object.entries(obj).map(([key, value]) => {
      if (typeof value === 'object' && !Array.isArray(value)) {
        return [toTitleCase(key), convertKeysToTitleCase(value as Record<string, unknown>, level + 1)]
      }
      if (Array.isArray(value)) {
        return [toTitleCase(key), value]
      }
      return [toTitleCase(key), value]
    })
  )
}

export function formatOrderedProduct(product: Product, order_id?: string, unique_event_id?: String) {
  // unique_id should ensure retries don't result in duplicate event. hence we use product_id or sku + order_id as unique_id
  const event_id = unique_event_id ?? order_id
  const unique_product_id = product.product_id || product.sku || product?.id
  // if unique_id is not provided, klaviyo will use timestamp for deduplication
  const unique_id = event_id && unique_product_id ? `${event_id}_${unique_product_id}` : undefined

  const { name, quantity, sku, price, url, image_url, category, product_id, id, ...otherProperties } = product
  const productProperties = {
    OrderId: order_id,
    ProductId: product_id ?? id,
    SKU: sku,
    ProductName: name,
    Quantity: quantity,
    Categories: category ? [category] : [],
    ProductURL: url,
    ImageURL: image_url,
    // copy other properties as is. If other properties have properties with same name
    // as the above, they will be overwritten which is the expected behavior
    ...convertKeysToTitleCase(otherProperties)
  }
  return { unique_id, productProperties }
}

export function formatProductItems(product: Product) {
  const { sku, name, quantity, price, category, url, image_url, id, product_id, ...otherProperties } = product
  const formattedProduct = {
    ProductId: product_id ?? id,
    SKU: sku,
    ProductName: name,
    Quantity: quantity,
    ItemPrice: price,
    RowTotal: price,
    Categories: category ? [category] : [],
    ProductURL: url,
    ImageURL: image_url,
    // copy other properties as is. If other properties have properties with same name
    // as the above, they will be overwritten which is the expected behavior
    ...otherProperties
  }
  return convertKeysToTitleCase(formattedProduct)
}
