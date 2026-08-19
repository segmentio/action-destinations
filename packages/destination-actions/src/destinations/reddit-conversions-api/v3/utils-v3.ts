import type { RequestClient } from '@segment/actions-core'
import { PayloadValidationError } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload as StandardEvent } from '../standardEvent/generated-types'
import type { Payload as CustomEvent } from '../customEvent/generated-types'
import { V3EventItem, V3Payload, V3Metadata, V3Product, V3User, V3DataProcessingOptions } from './types-v3'
import { processHashing } from '../../../lib/hashing-utils'
import { LATEST_API_VERSION } from '../versioning-info'

/** FLAGON_NAME
 * Flagon flag gating whether Reddit Conversions API v3 is reachable at all for an account.
 * https://flagon.segment.com/families/centrifuge-destinations/gates/reddit-conversions-api-canary-version
 */
export const FLAGON_NAME = 'reddit-conversions-api-canary-version'

type EventMetadataType = StandardEvent['event_metadata'] | CustomEvent['event_metadata']
type ProductsType = StandardEvent['products'] | CustomEvent['products']
type ConversionIdType = StandardEvent['conversion_id'] | CustomEvent['conversion_id']
type DataProcessingOptionsType = StandardEvent['data_processing_options'] | CustomEvent['data_processing_options']
type UserType = StandardEvent['user'] | CustomEvent['user']
type ScreenDimensionsType = StandardEvent['screen_dimensions'] | CustomEvent['screen_dimensions']

const V3_URL = (adAccountId: string) =>
  `https://ads-api.reddit.com/api/${LATEST_API_VERSION}/pixels/${adAccountId}/conversion_events`

// v2 tracking_type (mixed case) -> v3 UPPER_SNAKE_CASE.
const TRACKING_TYPE_V3: Record<string, string> = {
  PageVisit: 'PAGE_VISIT',
  ViewContent: 'VIEW_CONTENT',
  Search: 'SEARCH',
  AddToCart: 'ADD_TO_CART',
  AddToWishlist: 'ADD_TO_WISHLIST',
  Purchase: 'PURCHASE',
  Lead: 'LEAD',
  SignUp: 'SIGN_UP',
  Custom: 'CUSTOM'
}

export async function sendV3(request: RequestClient, settings: Settings, payload: StandardEvent[] | CustomEvent[]) {
  const data = createRedditPayloadV3(payload)
  return request(V3_URL(settings.ad_account_id), {
    method: 'POST',
    headers: { Authorization: `Bearer ${settings.conversion_token}` },
    json: JSON.parse(JSON.stringify(data))
  })
}

function createRedditPayloadV3(payloads: StandardEvent[] | CustomEvent[]): V3Payload {
  const test_id = clean((payloads[0] as StandardEvent | CustomEvent)?.test_id)

  const events: V3EventItem[] = payloads.map((payload) => {
    const {
      event_at,
      click_id,
      products,
      user,
      data_processing_options,
      screen_dimensions,
      event_metadata,
      conversion_id,
      action_source,
      event_source_url
    } = payload

    const custom_event_name = clean((payload as CustomEvent).custom_event_name)
    const tracking_type = custom_event_name ? 'Custom' : (payload as StandardEvent).tracking_type

    if (!action_source) {
      // The `action_source` field is conditionally required (only when `api_version` is `'v3'`),
      // so schema validation should already guarantee this is present by the time we get here.
      // This is a defensive backstop, not the primary enforcement mechanism.
      throw new PayloadValidationError('action_source is required when sending to Reddit Conversions API v3')
    }

    return {
      event_at: toEpochMs(event_at),
      action_source,
      event_source_url: clean(event_source_url),
      click_id: clean(click_id),
      type: {
        tracking_type: toV3TrackingType(tracking_type),
        custom_event_name
      },
      event_metadata: getMetadata(event_metadata, products, conversion_id),
      user: getUser(user, data_processing_options, screen_dimensions)
    }
  })

  return { data: { events, partner: 'SEGMENT', test_id } }
}

// v3 requires event_at as an integer Unix epoch in milliseconds. We own the timestamp source
// (defaults to $.timestamp, an ISO string), so we accept ISO strings and epoch-ms; anything else
// is rejected rather than sent wrong. EPOCH_MS_MIN guards against epoch *seconds* being misread
// as ms (a 10-digit seconds value is < 1e12, so it's rejected instead of landing in 1970).
const EPOCH_MS_MIN = 1e12
export function toEpochMs(value: string | number | undefined): number {
  if (value === undefined || value === null || value === '') {
    throw new PayloadValidationError('event_at is required')
  }
  // Already epoch milliseconds (number or numeric string), only if plausibly ms.
  if (typeof value === 'number' && Number.isInteger(value) && value >= EPOCH_MS_MIN) return value
  if (typeof value === 'string' && /^\d+$/.test(value.trim()) && Number(value.trim()) >= EPOCH_MS_MIN) {
    return Number(value.trim())
  }
  // ISO 8601 / RFC3339 string.
  if (typeof value === 'string' && !/^\d+$/.test(value.trim())) {
    const ms = Date.parse(value)
    if (!Number.isNaN(ms)) return ms
  }
  throw new PayloadValidationError(
    `event_at must be an ISO 8601 timestamp or epoch milliseconds, received: ${String(value)}`
  )
}

function toV3TrackingType(tracking_type: string | undefined): string {
  if (!tracking_type) throw new PayloadValidationError('tracking_type is required')
  const mapped = TRACKING_TYPE_V3[tracking_type]
  if (!mapped) throw new PayloadValidationError(`Unsupported tracking_type: ${tracking_type}`)
  return mapped
}

function clean(str: string | undefined): string | undefined {
  if (str === undefined || str === null || str === '') return undefined
  return str.trim()
}

function cleanNum(num: number | undefined): number | undefined {
  if (num === undefined || num === null) return undefined
  return num
}

function getProducts(products: ProductsType): V3Product[] | undefined {
  if (!products) return undefined
  return products.map((product) => ({
    category: clean(product.category),
    id: clean(product.id),
    name: clean(product.name),
    quantity: cleanNum(product.quantity),
    item_price: cleanNum(product.item_price)
  }))
}

function getMetadata(
  metadata: EventMetadataType,
  products: ProductsType,
  conversion_id: ConversionIdType
): V3Metadata | undefined {
  if (!metadata && !products && !conversion_id) return undefined
  return {
    currency: clean(metadata?.currency),
    item_count: cleanNum(metadata?.item_count),
    // The Segment-facing field is still named `value_decimal` (unchanged from v2, so existing
    // mappings keep working) - only the wire-level key sent to Reddit v3 renames to `value`.
    value: cleanNum(metadata?.value_decimal),
    products: getProducts(products),
    conversion_id: smartHash(conversion_id, (value) => value.trim())
  }
}

function getAdId(device_type?: string, advertising_id?: string): { [key: string]: string | undefined } | undefined {
  if (!device_type) return undefined
  if (!advertising_id) return undefined
  const hashedAdId = smartHash(advertising_id)
  return device_type === 'ios' ? { idfa: hashedAdId } : { aaid: hashedAdId }
}

function getDataProcessingOptions(
  dataProcessingOptions: DataProcessingOptionsType
): V3DataProcessingOptions | undefined {
  if (!dataProcessingOptions) return undefined
  return {
    country: clean(dataProcessingOptions.country),
    modes: dataProcessingOptions.modes?.split(',').map((mode) => mode.trim()),
    region: clean(dataProcessingOptions.region)
  }
}

function getScreen(height?: number, width?: number): { height: number; width: number } | undefined {
  if (height === undefined || width === undefined) return undefined
  return {
    height,
    width
  }
}

function getUser(
  user: UserType,
  dataProcessingOptions: DataProcessingOptionsType,
  screenDimensions: ScreenDimensionsType
): V3User | undefined {
  if (!user) return

  return {
    ...getAdId(user.device_type, user.advertising_id),
    email: smartHash(user.email, canonicalizeEmail),
    external_id: smartHash(user.external_id, (value) => value.trim()),
    ip_address: smartHash(user.ip_address, (value) => value.trim()),
    user_agent: clean(user.user_agent),
    uuid: clean(user.uuid),
    data_processing_options: getDataProcessingOptions(dataProcessingOptions),
    screen_dimensions: getScreen(screenDimensions?.height, screenDimensions?.width),
    phone_number: smartHash(user.phone_number, cleanPhoneNumber)
  }
}

function canonicalizeEmail(value: string): string {
  value = value.trim()
  const localPartAndDomain = value.split('@')
  const localPart = localPartAndDomain[0].replace(/\./g, '').split('+')[0]
  return `${localPart.toLowerCase()}@${localPartAndDomain[1].toLowerCase()}`
}

const smartHash = (value: string | undefined, cleaningFunction?: (value: string) => string): string | undefined => {
  if (value === undefined) return
  return processHashing(value, 'sha256', 'hex', cleaningFunction)
}

function cleanPhoneNumber(phoneNumber: string): string {
  if (!phoneNumber) return ''
  phoneNumber = phoneNumber.trim()
  const prefix = '+'
  if (phoneNumber.startsWith('+')) {
    phoneNumber = phoneNumber.slice(1)
  }
  // Remove any potential extensions from the number
  const extensions = ['ext', 'x', 'anexo', '#', 'poste', 'int']
  const lower = phoneNumber.toLowerCase()
  for (const keyword of extensions) {
    const index = lower.indexOf(keyword)
    if (index !== -1) {
      phoneNumber = phoneNumber.slice(0, index)
      break
    }
  }
  // Add the prefix and remove all non-numeric characters
  const digitsOnly = phoneNumber.replace(/\D/g, '')

  return prefix + digitsOnly
}
