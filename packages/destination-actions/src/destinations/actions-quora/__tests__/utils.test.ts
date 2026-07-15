import { MultiStatusResponse, ModifiedResponse } from '@segment/actions-core'
import {
  toEpochMicroseconds,
  resolveAccountId,
  buildConversionItem,
  handleBatchResponse,
  assertSingleEventSucceeded
} from '../trackConversion/utils'
import type { QuoraBatchResponse, QuoraSingleResponse, QuoraConversionItem } from '../types'
import type { Payload } from '../trackConversion/generated-types'

const basePayload = (overrides: Partial<Payload> = {}): Payload => ({
  event_name: 'Purchase',
  ...overrides
})

const mockResponse = <T>(status: number, data?: T): ModifiedResponse<T> =>
  ({ status, statusText: 'OK', data } as unknown as ModifiedResponse<T>)

describe('toEpochMicroseconds', () => {
  it('converts an ISO string to epoch microseconds', () => {
    expect(toEpochMicroseconds('2023-09-26T15:29:30.036Z')).toBe(1695742170036000)
  })

  it('converts an epoch-ms number to microseconds', () => {
    expect(toEpochMicroseconds(1695742170036)).toBe(1695742170036000)
  })

  it('returns undefined for missing/invalid input', () => {
    expect(toEpochMicroseconds(undefined)).toBeUndefined()
    expect(toEpochMicroseconds('not-a-date')).toBeUndefined()
  })
})

describe('resolveAccountId', () => {
  it('coerces a numeric string', () => {
    expect(resolveAccountId({ api_token: 't', account_id: '527745581653587' })).toBe(527745581653587)
  })

  it('throws on a non-numeric account id', () => {
    expect(() => resolveAccountId({ api_token: 't', account_id: 'abc' })).toThrow()
  })
})

describe('buildConversionItem', () => {
  it('builds nested user/device/conversion objects and omits empty sub-objects', () => {
    const item = buildConversionItem(
      basePayload({
        timestamp: '2023-09-26T15:29:30.036Z',
        click_id: 'qclid-1',
        value: 5.99,
        event_id: 'evt-1',
        user: { email: 'a@b.com' },
        device: {}
      })
    )
    expect(item.conversion.event_name).toBe('Purchase')
    expect(item.conversion.timestamp).toBe(1695742170036000)
    expect(item.user).toEqual({ email: 'a@b.com' })
    // device had only empty values -> omitted
    expect(item.device).toBeUndefined()
  })

  it('passes the event name straight through', () => {
    expect(buildConversionItem(basePayload({ event_name: 'Custom Thing' })).conversion.event_name).toBe('Custom Thing')
  })
})

describe('assertSingleEventSucceeded', () => {
  it('does not throw on a clean 200', () => {
    expect(() =>
      assertSingleEventSucceeded(mockResponse<QuoraSingleResponse>(200, { events_received: 1, events_errored: 0 }))
    ).not.toThrow()
  })

  it('throws when an event errored in the body', () => {
    expect(() =>
      assertSingleEventSucceeded(
        mockResponse<QuoraSingleResponse>(200, {
          events_received: 1,
          events_errored: 1,
          events: [{ status: 'ERROR', index: 0, error_code: 'VALUE_OUT_OF_RANGE', error_message: 'bad value' }]
        })
      )
    ).toThrow('bad value')
  })
})

describe('handleBatchResponse', () => {
  const items: QuoraConversionItem[] = [
    { conversion: { event_name: 'Purchase' } },
    { conversion: { event_name: 'Purchase' } }
  ]

  it('marks per-index success and error from the multi-status body', () => {
    const msr = new MultiStatusResponse()
    handleBatchResponse(
      mockResponse<QuoraBatchResponse>(200, {
        events_received: 2,
        events_errored: 1,
        events: [
          { status: 'OK', index: 0 },
          { status: 'ERROR', index: 1, error_code: 'VALUE_OUT_OF_RANGE', error_message: 'bad value' }
        ]
      }),
      items,
      [0, 1],
      msr
    )
    expect(msr.isSuccessResponseAtIndex(0)).toBe(true)
    expect(msr.isErrorResponseAtIndex(1)).toBe(true)
  })

  it('defaults items missing from the events array to success', () => {
    const msr = new MultiStatusResponse()
    handleBatchResponse(mockResponse<QuoraBatchResponse>(200, { events: [] }), items, [0, 1], msr)
    expect(msr.isSuccessResponseAtIndex(0)).toBe(true)
    expect(msr.isSuccessResponseAtIndex(1)).toBe(true)
  })

  it('marks every item errored on a transport-level failure', () => {
    const msr = new MultiStatusResponse()
    handleBatchResponse(mockResponse<QuoraBatchResponse>(500), items, [0, 1], msr)
    expect(msr.isErrorResponseAtIndex(0)).toBe(true)
    expect(msr.isErrorResponseAtIndex(1)).toBe(true)
  })

  it('correlates results to original indices when some payloads were skipped', () => {
    const msr = new MultiStatusResponse()
    // Only one valid payload, mapped to original index 2
    handleBatchResponse(
      mockResponse<QuoraBatchResponse>(200, {
        events: [{ status: 'ERROR', index: 0, error_message: 'nope' }]
      }),
      [items[0]],
      [2],
      msr
    )
    expect(msr.isErrorResponseAtIndex(2)).toBe(true)
  })
})
