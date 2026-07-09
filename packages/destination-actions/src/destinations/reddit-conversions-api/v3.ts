import type { RequestClient } from '@segment/actions-core'
import { PayloadValidationError } from '@segment/actions-core'
import type { Settings } from './generated-types'
import type { Payload as StandardEvent } from './standardEvent/generated-types'
import type { Payload as CustomEvent } from './customEvent/generated-types'
import { REDDIT_CONVERSIONS_CANARY_API_VERSION } from './versioning-info'
import {
  EventMetadataType,
  ProductsType,
  ConversionIdType,
  DataProcessingOptionsType,
  UserType,
  ScreenDimensionsType,
  clean,
  cleanNum,
  getScreen,
  canonicalizeEmail,
  smartHash,
  cleanPhoneNumber,
  getAdId
} from './shared'
import { V3EventItem, V3Payload, V3Metadata, V3Product, V3User, V3DataProcessingOptions } from './types'

const V3_URL = (pixelId: string) =>
  `https://ads-api.reddit.com/api/${REDDIT_CONVERSIONS_CANARY_API_VERSION}/pixels/${pixelId}/conversion_events`

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
  const test_id = clean(payloads[0]?.test_id)

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

    return {
      event_at: toEpochMs(event_at),
      action_source,
      event_source_url: clean(event_source_url),
      click_id: clean(click_id),
      type: {
        tracking_type: toV3TrackingType(tracking_type),
        custom_event_name
      },
      metadata: getMetadata(event_metadata, products, conversion_id),
      user: getUser(user, data_processing_options, screen_dimensions)
    }
  })

  return { data: { events, partner: 'SEGMENT', test_id } }
}

// v3 requires event_at as an integer Unix epoch in milliseconds. We own the
// timestamp source (defaults to $.timestamp, an ISO string), so we accept ISO
// strings and 13-digit epoch-ms; anything else is rejected rather than sent wrong.
export function toEpochMs(value: string | number | undefined): number {
  if (value === undefined || value === null || value === '') {
    throw new PayloadValidationError('event_at is required')
  }
  // Already epoch milliseconds (number or 13-digit numeric string).
  if (typeof value === 'number' && Number.isInteger(value)) return value
  if (typeof value === 'string' && /^\d{13}$/.test(value.trim())) return Number(value.trim())
  // ISO 8601 / RFC3339 string.
  if (typeof value === 'string') {
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
    value: cleanNum(metadata?.value_decimal),
    products: getProducts(products),
    conversion_id: smartHash(conversion_id, (value) => value.trim())
  }
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
