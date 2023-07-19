import { omit } from '@segment/actions-core'
import { Payload as UpdateCart } from './updateCart/generated-types'
import { CommerceItem, Region } from './shared-fields'

// Regular expression for matching ISO date strings in various formats
// Taken from https://github.com/segmentio/isodate/blob/master/lib/index.js
const isoDateRegExp =
  /^(\d{4})(?:-?(\d{2})(?:-?(\d{2}))?)?(?:([ T])(\d{2}):?(\d{2})(?::?(\d{2})(?:[,\.](\d{1,}))?)?(?:(Z)|([+\-])(\d{2})(?::?(\d{2}))?)?)?$/ // eslint-disable-line no-useless-escape

/**
 * Converts a given ISO date string to the format accepted by Iterable's API.
 * @param {string} isoDateStr - An ISO date string, such as "2022-05-13T10:30:52.853Z".
 * @returns {string|null} The converted date string or null if the input is invalid.
 */
function dateToIterableDateStringFormat(isoDateStr: string) {
  if (!isoDateRegExp.test(isoDateStr)) {
    return null // not a valid ISO string
  }
  const date = new Date(isoDateStr)
  if (date instanceof Date && !isNaN(date.valueOf())) {
    const dateString = date.toISOString().replace('T', ' ').split('.')[0]
    return `${dateString} +00:00`
  }
  return null
}

/**
 * Recursively converts all ISO date strings in an object to the format accepted by Iterable's API.
 * @param {Object} obj - The object to be converted.
 * @returns {Object} The converted object.
 */
export function convertDatesInObject(obj: Record<string, unknown>) {
  if (typeof obj !== 'object' || obj === null) {
    return obj
  }
  for (const prop in obj) {
    let value = obj[prop]
    if (typeof value === 'string' && isoDateRegExp.test(value)) {
      const dateValue = new Date(value)
      if (!isNaN(dateValue.valueOf())) {
        value = dateValue
      }
    }
    if (value instanceof Date) {
      obj[prop] = dateToIterableDateStringFormat(value.toISOString())
    } else if (typeof value === 'object' && value !== null) {
      convertDatesInObject(value as Record<string, unknown>)
    } else {
      obj[prop] = value
    }
  }
  return obj
}

/**
 * Transforms an array of items into an array of CommerceItem objects.
 *
 * @param {Payload['items']} items - The array of items to transform.
 * @returns {CartItem[]} The transformed array of CommerceItem objects.
 */
export function transformItems(items: UpdateCart['items']): CommerceItem[] {
  const reservedItemKeys = [
    'product_id',
    'id',
    'sku',
    'name',
    'price',
    'quantity',
    'categories',
    'category',
    'url',
    'image_url',
    'imageUrl'
  ]

  return items.map(({ dataFields, categories, ...rest }) => ({
    ...rest,
    dataFields: convertDatesInObject(omit(rest, reservedItemKeys) || {}),
    ...(categories && { categories: [categories] })
  }))
}

export const apiEndpoints = {
  updateUser: {
    united_states: 'https://api.iterable.com/api/users/update',
    europe: 'https://api.eu.iterable.com/api/users/update'
  },
  trackEvent: {
    united_states: 'https://api.iterable.com/api/events/track',
    europe: 'https://api.eu.iterable.com/api/events/track'
  },
  updateCart: {
    united_states: 'https://api.iterable.com/api/commerce/updateCart',
    europe: 'https://api.eu.iterable.com/api/commerce/updateCart'
  },
  trackPurchase: {
    united_states: 'https://api.iterable.com/api/commerce/trackPurchase',
    europe: 'https://api.eu.iterable.com/api/commerce/trackPurchase'
  },
  getWebhooks: {
    united_states: 'https://api.iterable.com/api/webhooks',
    europe: 'https://api.eu.iterable.com/api/webhooks'
  }
}

/**
 * Retrieves the regional API endpoint for a specific API action.
 * If the region provided is invalid or not specified, it defaults to 'united_states'.
 *
 * @param action The name of the API action.
 * @param region The region for data residency.
 * @returns The regional API endpoint.
 */
export function getRegionalEndpoint(action: keyof typeof apiEndpoints, region: Region = 'united_states'): string {
  return apiEndpoints[action][region] ?? apiEndpoints[action]['united_states']
}
