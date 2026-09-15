import type { RequestClient, JSONLikeObject } from '@segment/actions-core'
import { PayloadValidationError, MultiStatusResponse } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload as StandardEvent } from '../standardEvent/generated-types'
import type { Payload as CustomEvent } from '../customEvent/generated-types'
import { EventItemV3, PayloadV3, MetadataV3, ProductV3, ActionSourceV3, EventTypeV3 } from './types-v3'
import { ACTION_SOURCE_V3_LABELS, TRACKING_TYPE_V3 } from './constants'
import { clean, cleanNum, getUser, smartHash, supportsValueMetadata, supportsItemCount } from '../utils'
import { LATEST_API_VERSION } from '../versioning-info'

type EventMetadataType = StandardEvent['event_metadata'] | CustomEvent['event_metadata']
type ProductsType = StandardEvent['products'] | CustomEvent['products']
type ConversionIdType = StandardEvent['conversion_id'] | CustomEvent['conversion_id']

export async function sendV3(
  request: RequestClient,
  settings: Settings,
  payloads: (StandardEvent | CustomEvent)[],
  isBatch: boolean
) {
  const multiStatusResponse = new MultiStatusResponse()
  const data = createRedditPayloadV3(payloads, settings, multiStatusResponse, isBatch)

  if (data.data.events.length) {
    const response = await request(
      `https://ads-api.reddit.com/api/${LATEST_API_VERSION}/pixels/${settings.ad_account_id}/conversion_events`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${settings.conversion_token}` },
        json: JSON.parse(JSON.stringify(data))
      }
    )
    if (!isBatch) {
      return response
    }
  }

  return multiStatusResponse
}

export function createRedditPayloadV3(
  payloads: (StandardEvent | CustomEvent)[],
  settings: Settings,
  multiStatusResponse: MultiStatusResponse,
  isBatch: boolean
): PayloadV3 {
  const indices: number[] = []
  const events: EventItemV3[] = []

  payloads.forEach((payload, index) => {
    try {
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

      const event: EventItemV3 = {
        event_at: toEpochMs(event_at),
        action_source: toActionSourceV3(action_source),
        event_source_url: clean(event_source_url),
        click_id: clean(click_id),
        type: {
          tracking_type: toV3TrackingType(tracking_type),
          custom_event_name
        },
        metadata: getMetadata(event_metadata, products, conversion_id, tracking_type),
        user: getUser(user, data_processing_options, screen_dimensions)
      }

      indices.push(index)
      events.push(event)
      multiStatusResponse.setSuccessResponseAtIndex(index, {
        status: 200,
        sent: events[indices.indexOf(index)] as unknown as JSONLikeObject,
        body: { success: true }
      })
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Invalid payload for Reddit Conversions API v3'
      if (!isBatch) {
        throw new PayloadValidationError(error)
      }
      multiStatusResponse.setErrorResponseAtIndex(index, { status: 400, errormessage: error })
    }
  })

  return { data: { events, partner: 'SEGMENT', test_id: clean(settings.test_id) } }
}

export function toEpochMs(value: string | number | undefined): number {
  const EPOCH_MS_MIN = 1e12
  if (value === undefined || value === null || value === '') {
    throw new PayloadValidationError('event_at is required')
  }
  if (typeof value === 'number' && Number.isInteger(value) && value >= EPOCH_MS_MIN) return value
  if (typeof value === 'string') {
    const trimmed = value.trim()
    const isDigitsOnly = /^\d+$/.test(trimmed)
    if (isDigitsOnly && Number(trimmed) >= EPOCH_MS_MIN) return Number(trimmed)
    if (!isDigitsOnly) {
      const ms = Date.parse(value)
      if (!Number.isNaN(ms)) return ms
    }
  }
  throw new PayloadValidationError(
    `event_at must be an ISO 8601 timestamp or epoch milliseconds, received: ${String(value)}`
  )
}

export function toV3TrackingType(tracking_type: string | undefined): EventTypeV3 {
  if (!tracking_type) throw new PayloadValidationError('tracking_type is required')
  const mapped = (TRACKING_TYPE_V3 as Record<string, EventTypeV3>)[tracking_type]
  if (!mapped) throw new PayloadValidationError(`Unsupported tracking_type: ${tracking_type}`)
  return mapped
}

export function toActionSourceV3(action_source: string | undefined): ActionSourceV3 {
  if (!action_source)
    throw new PayloadValidationError('action_source is required when sending to Reddit Conversions API v3')
  if (!(action_source in ACTION_SOURCE_V3_LABELS)) {
    throw new PayloadValidationError(`Unsupported action_source: ${action_source}`)
  }
  return action_source as ActionSourceV3
}

export function getProducts(products: ProductsType): ProductV3[] | undefined {
  if (!products) return undefined
  return products.map((product) => ({
    category: clean(product.category),
    id: toProductIdV3(product.id),
    name: clean(product.name),
    quantity: cleanNum(product.quantity),
    item_price: cleanNum(product.item_price)
  }))
}

export function toProductIdV3(id: string | undefined): string {
  const cleaned = clean(id)
  if (!cleaned) throw new PayloadValidationError('products.id is required when sending to Reddit Conversions API v3')
  return cleaned
}

export function getMetadata(
  metadata: EventMetadataType,
  products: ProductsType,
  conversion_id: ConversionIdType,
  trackingType?: string
): MetadataV3 | undefined {
  if (!metadata && !products && !conversion_id) return undefined
  const valueMetadataSupported = supportsValueMetadata(trackingType)
  const itemCountSupported = supportsItemCount(trackingType)

  return {
    currency: valueMetadataSupported ? clean(metadata?.currency) : undefined,
    item_count: itemCountSupported ? cleanNum(metadata?.item_count) : undefined,
    // The Segment-facing field is still named `value_decimal` (unchanged from v2, so existing
    // mappings keep working) - only the wire-level key sent to Reddit v3 renames to `value`.
    value: valueMetadataSupported ? cleanNum(metadata?.value_decimal) : undefined,
    products: getProducts(products),
    conversion_id: smartHash(conversion_id, (value) => value.trim())
  }
}
