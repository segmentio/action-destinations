import crypto from 'crypto'
import nock from 'nock'
import { MultiStatusResponse } from '@segment/actions-core'
import createRequestClient from '../../../../../core/src/create-request-client'
import {
  sendV3,
  createRedditPayloadV3,
  toEpochMs,
  toV3TrackingType,
  toActionSourceV3,
  getProducts,
  toProductIdV3,
  getMetadata
} from '../v3/utils-v3'
import type { Settings } from '../generated-types'
import type { Payload as StandardEvent } from '../standardEvent/generated-types'

const settings: Settings = {
  ad_account_id: 'ad_account_id_1',
  conversion_token: 'conversion_token_1'
}

// Matches smartHash(conversion_id, (value) => value.trim()) in ../v3/utils-v3.ts
const sha256 = (value: string) => crypto.createHash('sha256').update(value.trim()).digest('hex')

function buildPayload(overrides: Partial<StandardEvent> = {}): StandardEvent {
  return {
    event_at: 1704721970212,
    tracking_type: 'Purchase',
    action_source: 'WEBSITE',
    ...overrides
  }
}

describe('toEpochMs', () => {
  it('passes through an epoch-ms number unchanged', () => {
    expect(toEpochMs(1704721970212)).toBe(1704721970212)
  })

  it('passes through an epoch-ms numeric string unchanged', () => {
    expect(toEpochMs('1704721970212')).toBe(1704721970212)
  })

  it('parses an ISO 8601 timestamp with milliseconds into epoch ms', () => {
    expect(toEpochMs('2024-01-08T13:52:50.212Z')).toBe(1704721970212)
  })

  it('parses an ISO 8601 timestamp with no milliseconds into epoch ms', () => {
    expect(toEpochMs('2024-01-08T13:52:50Z')).toBe(1704721970000)
  })

  it('parses an ISO 8601 timestamp with a positive UTC offset into epoch ms', () => {
    expect(toEpochMs('2024-01-08T18:52:50.212+05:00')).toBe(1704721970212)
  })

  it('parses an ISO 8601 timestamp with a negative UTC offset into epoch ms', () => {
    expect(toEpochMs('2024-01-08T08:52:50.212-05:00')).toBe(1704721970212)
  })

  it('parses a date-only ISO 8601 string as midnight UTC', () => {
    expect(toEpochMs('2024-01-08')).toBe(1704672000000)
  })

  it('throws when value is undefined', () => {
    expect(() => toEpochMs(undefined)).toThrow('event_at is required')
  })

  it('throws when value is an empty string', () => {
    expect(() => toEpochMs('')).toThrow('event_at is required')
  })

  it('throws when a numeric string is below the epoch-ms floor (looks like epoch seconds)', () => {
    expect(() => toEpochMs('1704721970')).toThrow(
      'event_at must be an ISO 8601 timestamp or epoch milliseconds, received: 1704721970'
    )
  })

  it('throws when a number is below the epoch-ms floor', () => {
    expect(() => toEpochMs(1704721970)).toThrow(
      'event_at must be an ISO 8601 timestamp or epoch milliseconds, received: 1704721970'
    )
  })

  it('throws when the value is an unparseable string', () => {
    expect(() => toEpochMs('not-a-date')).toThrow(
      'event_at must be an ISO 8601 timestamp or epoch milliseconds, received: not-a-date'
    )
  })
})

describe('toV3TrackingType', () => {
  it('maps a v2 tracking_type to its v3 UPPER_SNAKE_CASE equivalent', () => {
    expect(toV3TrackingType('Purchase')).toBe('PURCHASE')
    expect(toV3TrackingType('PageVisit')).toBe('PAGE_VISIT')
    expect(toV3TrackingType('Custom')).toBe('CUSTOM')
  })

  it('throws when tracking_type is undefined', () => {
    expect(() => toV3TrackingType(undefined)).toThrow('tracking_type is required')
  })

  it('throws when tracking_type is not a supported value', () => {
    expect(() => toV3TrackingType('NotARealTrackingType')).toThrow('Unsupported tracking_type: NotARealTrackingType')
  })
})

describe('toActionSourceV3', () => {
  it('passes through a supported action_source', () => {
    expect(toActionSourceV3('WEBSITE')).toBe('WEBSITE')
    expect(toActionSourceV3('APP')).toBe('APP')
    expect(toActionSourceV3('OTHER')).toBe('OTHER')
    expect(toActionSourceV3('PHYSICAL_STORE')).toBe('PHYSICAL_STORE')
  })

  it('throws when action_source is undefined', () => {
    expect(() => toActionSourceV3(undefined)).toThrow(
      'action_source is required when sending to Reddit Conversions API v3'
    )
  })

  it('throws when action_source is not a supported value', () => {
    expect(() => toActionSourceV3('NOT_REAL')).toThrow('Unsupported action_source: NOT_REAL')
  })
})

describe('toProductIdV3', () => {
  it('trims and passes through a valid id', () => {
    expect(toProductIdV3('  product_id_1  ')).toBe('product_id_1')
  })

  it('throws when id is undefined', () => {
    expect(() => toProductIdV3(undefined)).toThrow('products.id is required when sending to Reddit Conversions API v3')
  })

  it('throws when id is an empty string', () => {
    expect(() => toProductIdV3('')).toThrow('products.id is required when sending to Reddit Conversions API v3')
  })
})

describe('getProducts', () => {
  it('returns undefined when products is undefined', () => {
    expect(getProducts(undefined)).toBeUndefined()
  })

  it('maps every product field, defaulting quantity/item_price through cleanNum', () => {
    expect(
      getProducts([
        { category: ' category_1 ', id: 'product_id_1', name: ' name_1 ', quantity: 2, item_price: 25 },
        { id: 'product_id_2' }
      ])
    ).toEqual([
      { category: 'category_1', id: 'product_id_1', name: 'name_1', quantity: 2, item_price: 25 },
      { category: undefined, id: 'product_id_2', name: undefined, quantity: undefined, item_price: undefined }
    ])
  })

  it('throws when any product in the list is missing an id', () => {
    expect(() => getProducts([{ id: 'product_id_1' }, { category: 'category_2' }])).toThrow(
      'products.id is required when sending to Reddit Conversions API v3'
    )
  })
})

describe('getMetadata', () => {
  it('returns undefined when metadata, products, and conversion_id are all absent', () => {
    expect(getMetadata(undefined, undefined, undefined)).toBeUndefined()
  })

  it('maps currency/item_count/value_decimal->value, and hashes conversion_id', () => {
    const result = getMetadata({ currency: 'USD', item_count: 10, value_decimal: 100 }, undefined, 'msg-1')
    expect(result?.currency).toBe('USD')
    expect(result?.item_count).toBe(10)
    expect(result?.value).toBe(100)
    expect(result?.products).toBeUndefined()
    // conversion_id is smartHash'd - assert the actual sha256 hex digest, not just its shape.
    expect(result?.conversion_id).toBe(sha256('msg-1'))
  })

  it('is present (not undefined) when only products are provided', () => {
    const result = getMetadata(undefined, [{ id: 'product_id_1' }], undefined)
    expect(result).toEqual({
      currency: undefined,
      item_count: undefined,
      value: undefined,
      products: [
        { category: undefined, id: 'product_id_1', name: undefined, quantity: undefined, item_price: undefined }
      ],
      conversion_id: undefined
    })
  })
})

describe('createRedditPayloadV3', () => {
  it('builds a v3 event item for a single valid standardEvent payload and marks it success', () => {
    const multiStatusResponse = new MultiStatusResponse()
    const payload = buildPayload({
      event_at: '2024-01-08T13:52:50.212Z',
      click_id: 'click_id_1',
      event_source_url: 'https://example.com/checkout'
    })

    const result = createRedditPayloadV3([payload], settings, multiStatusResponse, false)

    expect(result).toEqual({
      data: {
        partner: 'SEGMENT',
        test_id: undefined,
        events: [
          {
            event_at: 1704721970212,
            action_source: 'WEBSITE',
            event_source_url: 'https://example.com/checkout',
            click_id: 'click_id_1',
            type: { tracking_type: 'PURCHASE', custom_event_name: undefined },
            event_metadata: undefined,
            user: undefined
          }
        ]
      }
    })

    expect(multiStatusResponse.isSuccessResponseAtIndex(0)).toBe(true)
    expect(multiStatusResponse.getResponseAtIndex(0)).toMatchObject({ status: 200, body: { success: true } })
  })

  it('routes settings.test_id onto the payload', () => {
    const multiStatusResponse = new MultiStatusResponse()
    const result = createRedditPayloadV3(
      [buildPayload()],
      { ...settings, test_id: 'test-123' },
      multiStatusResponse,
      false
    )
    expect(result.data.test_id).toBe('test-123')
  })

  it('throws for a single (non-batch) invalid payload instead of recording a MultiStatusResponse error', () => {
    const multiStatusResponse = new MultiStatusResponse()
    const payload = buildPayload({ action_source: undefined })

    expect(() => createRedditPayloadV3([payload], settings, multiStatusResponse, false)).toThrow(
      'action_source is required when sending to Reddit Conversions API v3'
    )
    expect(multiStatusResponse.length()).toBe(0)
  })

  it('for a batch, records a MultiStatusResponse error at the failing index and continues processing the rest', () => {
    const multiStatusResponse = new MultiStatusResponse()
    const payloads = [
      buildPayload(),
      buildPayload({ action_source: undefined }),
      buildPayload({ event_at: 1704721970212 })
    ]

    const result = createRedditPayloadV3(payloads, settings, multiStatusResponse, true)

    expect(result.data.events).toHaveLength(2)
    expect(multiStatusResponse.isSuccessResponseAtIndex(0)).toBe(true)
    expect(multiStatusResponse.isErrorResponseAtIndex(1)).toBe(true)
    expect(multiStatusResponse.getResponseAtIndex(1)).toMatchObject({
      status: 400,
      errormessage: 'action_source is required when sending to Reddit Conversions API v3'
    })
    expect(multiStatusResponse.isSuccessResponseAtIndex(2)).toBe(true)
  })
})

describe('sendV3', () => {
  const request = createRequestClient()

  afterEach(() => {
    nock.cleanAll()
  })

  it('POSTs to the v3 conversion_events endpoint and returns the raw response for a single (non-batch) event', async () => {
    nock('https://ads-api.reddit.com').post('/api/v3/pixels/ad_account_id_1/conversion_events').reply(200, {
      ok: true
    })

    const response = await sendV3(request, settings, [buildPayload()], false)
    expect((response as { status: number }).status).toBe(200)
  })

  it('returns a MultiStatusResponse for a batch, and does not make an HTTP call when every payload fails validation', async () => {
    const scope = nock('https://ads-api.reddit.com')
      .post('/api/v3/pixels/ad_account_id_1/conversion_events')
      .reply(200, {})

    const payloads = [buildPayload({ action_source: undefined }), buildPayload({ action_source: undefined })]
    const response = await sendV3(request, settings, payloads, true)

    expect(response).toBeInstanceOf(MultiStatusResponse)
    const multiStatusResponse = response as MultiStatusResponse
    expect(multiStatusResponse.isErrorResponseAtIndex(0)).toBe(true)
    expect(multiStatusResponse.isErrorResponseAtIndex(1)).toBe(true)
    expect(scope.isDone()).toBe(false)
  })

  it('returns a MultiStatusResponse for a batch that has at least one valid payload, and does make an HTTP call', async () => {
    const scope = nock('https://ads-api.reddit.com')
      .post('/api/v3/pixels/ad_account_id_1/conversion_events')
      .reply(200, {})

    const payloads = [buildPayload(), buildPayload({ action_source: undefined })]
    const response = await sendV3(request, settings, payloads, true)

    expect(response).toBeInstanceOf(MultiStatusResponse)
    const multiStatusResponse = response as MultiStatusResponse
    expect(multiStatusResponse.isSuccessResponseAtIndex(0)).toBe(true)
    expect(multiStatusResponse.isErrorResponseAtIndex(1)).toBe(true)
    expect(scope.isDone()).toBe(true)
  })
})
