import { omit } from '@segment/actions-core'
import { Payload as UpdateCart } from './updateCart/generated-types'
import { CommerceItem, DataCenterLocation } from './shared-fields'

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

const regionBaseUrls = {
  united_states: 'https://api.iterable.com',
  europe: 'https://api.eu.iterable.com'
  // Add more regions and their corresponding endpoints here
}

export const apiEndpoints = {
  updateUser: '/api/users/update',
  trackEvent: '/api/events/track',
  updateCart: '/api/commerce/updateCart',
  trackPurchase: '/api/commerce/trackPurchase',
  getWebhooks: '/api/webhooks'
}

/**
 * Retrieves the regional API endpoint for a specific API action.
 * If the data center location provided is invalid or not specified, it defaults to 'united_states'.
 *
 * @param action The name of the API action.
 * @param dataCenterLocation The data center location for data residency.
 * @returns The regional API endpoint.
 */
export function getRegionalEndpoint(
  action: keyof typeof apiEndpoints,
  dataCenterLocation: DataCenterLocation = 'united_states'
): string {
  const regionBaseUrl = regionBaseUrls[dataCenterLocation] || regionBaseUrls['united_states']
  const endpoint = apiEndpoints[action]
  return regionBaseUrl + endpoint
}
