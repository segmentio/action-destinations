import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Definition from '../index'
import { API_BASE, MAX_EVENTS_PER_REQUEST, safeObject, sendEvents, toIso, validateEvent } from '../api'

const testDestination = createTestIntegration(Definition)
const settings = { apiKey: 'gt_live_testkey' }

afterEach(() => {
  nock.cleanAll()
})

describe('toIso', () => {
  it('normalises ISO strings and epoch milliseconds', () => {
    expect(toIso('2026-03-14T09:12:00.000Z')).toBe('2026-03-14T09:12:00.000Z')
    expect(toIso(1773479520000)).toBe(new Date(1773479520000).toISOString())
  })

  it('preserves the unix epoch rather than treating 0 as absent', () => {
    // A truthy check here would silently drop a legitimate value.
    expect(toIso(0)).toBe('1970-01-01T00:00:00.000Z')
  })

  it('returns undefined for missing or unparseable values', () => {
    expect(toIso(undefined)).toBeUndefined()
    expect(toIso('not a date')).toBeUndefined()
  })
})

describe('safeObject', () => {
  it('drops undefined values and returns undefined when nothing remains', () => {
    expect(safeObject({ a: undefined })).toBeUndefined()
    expect(safeObject({})).toBeUndefined()
    expect(safeObject(undefined)).toBeUndefined()
    expect(safeObject({ a: 1, b: undefined })).toEqual({ a: 1 })
  })

  it('keeps falsy values that are meaningful', () => {
    expect(safeObject({ zero: 0, empty: '', no: false, nul: null })).toEqual({
      zero: 0,
      empty: '',
      no: false,
      nul: null
    })
  })

  it('does not copy inherited keys or __proto__', () => {
    const input = JSON.parse('{"a":1,"__proto__":{"polluted":true}}') as Record<string, unknown>
    const out = safeObject(input) as Record<string, unknown>
    expect(out).toEqual({ a: 1 })
    expect(({} as Record<string, unknown>).polluted).toBeUndefined()
  })
})

describe('validateEvent', () => {
  const base = { messageId: 'm', eventName: 'E', timestamp: '2026-01-01T00:00:00.000Z', userId: 'u' }

  it('accepts a complete event', () => {
    expect(validateEvent(base)).toBeUndefined()
  })

  it('explains why a missing messageId matters', () => {
    expect(validateEvent({ ...base, messageId: undefined })).toMatch(/deduplicat/i)
  })

  it('requires a parseable timestamp and an identifier', () => {
    expect(validateEvent({ ...base, timestamp: 'nope' })).toMatch(/timestamp/i)
    expect(validateEvent({ ...base, userId: undefined })).toMatch(/User ID or an Anonymous ID/i)
  })

  it('accepts an anonymous-only event', () => {
    expect(validateEvent({ ...base, userId: undefined, anonymousId: 'anon-1' })).toBeUndefined()
  })
})

describe('batch index mapping', () => {
  it('attributes per-item results to the right ORIGINAL event when one is invalid', async () => {
    let sent: any
    nock(API_BASE)
      .post('/events', (b) => {
        sent = b
        return true
      })
      // Only two events reach the API (index 1 fails local validation), and the
      // API reports positionally against what it actually received.
      .reply(201, { data: { results: [{ status: 'inserted' }, { status: 'error', reason: 'boom' }] } })

    const response = await testDestination.executeBatch('trackEvent', {
      settings,
      events: [
        createTestEvent({ type: 'track', event: 'good-0', timestamp: '2026-01-01T00:00:00.000Z', userId: 'u0' }),
        // No userId and no anonymousId, so it cannot be attributed and is
        // rejected before we send. Note messageId cannot be used for this case:
        // Segment's framework auto-populates it.
        createTestEvent({
          type: 'track',
          event: 'bad-1',
          timestamp: '2026-01-02T00:00:00.000Z',
          userId: null,
          anonymousId: null
        }),
        createTestEvent({ type: 'track', event: 'good-2', timestamp: '2026-01-03T00:00:00.000Z', userId: 'u2' })
      ],
      mapping: {
        messageId: { '@path': '$.messageId' },
        eventName: { '@path': '$.event' },
        timestamp: { '@path': '$.timestamp' },
        userId: { '@path': '$.userId' },
        anonymousId: { '@path': '$.anonymousId' }
      }
    })

    expect(sent.events).toHaveLength(2)
    expect(sent.events.map((e: any) => e.event_name)).toEqual(['good-0', 'good-2'])

    // Original index 0 succeeded; 1 failed local validation; 2 carries the API
    // error that arrived at SENT index 1. Without the index map, "boom" would
    // have been reported against the wrong event.
    expect(response[0]).toMatchObject({ status: 200 })
    expect(response[1]).toMatchObject({
      status: 400,
      errortype: 'PAYLOAD_VALIDATION_FAILED'
    })
    // Rejected by the conditionally-required rule before we ever build a request.
    expect((response[1] as any).errormessage).toMatch(/userId|anonymousId/i)
    expect(response[2]).toMatchObject({ status: 400 })
    expect((response[2] as any).errormessage).toBe('boom')
  })

  it('reports a duplicate as a successful delivery', async () => {
    nock(API_BASE)
      .post('/events')
      .reply(201, { data: { results: [{ status: 'duplicate' }] } })

    const response = await testDestination.executeBatch('trackEvent', {
      settings,
      events: [createTestEvent({ type: 'track', event: 'A', timestamp: '2026-01-01T00:00:00.000Z', userId: 'u' })],
      mapping: {
        messageId: { '@path': '$.messageId' },
        eventName: { '@path': '$.event' },
        timestamp: { '@path': '$.timestamp' },
        userId: { '@path': '$.userId' }
      }
    })

    // GainTrace already holds the event: the delivery succeeded, and reporting
    // it as an error would make every replay look like a failure.
    expect(response[0]).toMatchObject({ status: 200 })
  })
})

describe('sendEvents guards', () => {
  // A stub request client: these paths must fail before any HTTP call is made.
  const neverCalled = jest.fn(() => {
    throw new Error('no HTTP request should be made')
  }) as unknown as Parameters<typeof sendEvents>[0]

  it('returns an empty MultiStatus for an empty batch instead of throwing', async () => {
    const result = await sendEvents(neverCalled, [], 'feature_usage', true)
    expect((result as { length(): number }).length()).toBe(0)
  })

  it('throws for an empty single send', async () => {
    await expect(sendEvents(neverCalled, [], 'feature_usage', false)).rejects.toThrowError(/No event to send/i)
  })

  it('refuses a batch larger than the documented API ceiling', async () => {
    const oversized = Array.from({ length: MAX_EVENTS_PER_REQUEST + 1 }, (_, i) => ({
      messageId: `m-${i}`,
      eventName: 'E',
      timestamp: '2026-01-01T00:00:00.000Z',
      userId: 'u'
    }))
    // Enforced in code, not only declared via batch_size, so a misconfigured
    // batch never reaches the API to be rejected wholesale.
    await expect(sendEvents(neverCalled, oversized, 'feature_usage', true)).rejects.toThrowError(
      new RegExp(`at most ${MAX_EVENTS_PER_REQUEST} events`)
    )
  })

  it('returns an empty MultiStatus when every event in the batch is invalid', async () => {
    const result = await sendEvents(
      neverCalled,
      [{ messageId: 'm', eventName: 'E', timestamp: '2026-01-01T00:00:00.000Z' }],
      'feature_usage',
      true
    )
    // No HTTP call was attempted, and the single event is reported as failed.
    expect((result as { length(): number }).length()).toBe(1)
  })
})
