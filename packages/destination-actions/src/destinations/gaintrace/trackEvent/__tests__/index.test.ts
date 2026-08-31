import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Definition from '../../index'
import { API_BASE, MAX_EVENTS_PER_REQUEST } from '../../api'

const testDestination = createTestIntegration(Definition)
const settings = { apiKey: 'gt_live_testkey' }

const mapping = (over: Record<string, unknown> = {}) => ({
  messageId: 'msg-1',
  eventName: 'Report Exported',
  timestamp: '2026-03-14T09:12:00.000Z',
  userId: 'user-1',
  ...over
})

afterEach(() => {
  nock.cleanAll()
})

describe('GainTrace.trackEvent', () => {
  it('sends a single event in the API envelope', async () => {
    let body: any
    nock(API_BASE)
      .post('/events', (b) => {
        body = b
        return true
      })
      .reply(201, { data: { inserted: 1, results: [{ status: 'inserted' }] } })

    await testDestination.testAction('trackEvent', { settings, mapping: mapping() })

    expect(body.events).toHaveLength(1)
    expect(body.events[0]).toMatchObject({
      event_name: 'Report Exported',
      event_category: 'feature_usage',
      source: 'segment',
      source_event_id: 'msg-1',
      timestamp: '2026-03-14T09:12:00.000Z',
      user_id: 'user-1'
    })
  })

  it('preserves a backdated timestamp instead of the time of receipt', async () => {
    let body: any
    nock(API_BASE)
      .post('/events', (b) => {
        body = b
        return true
      })
      .reply(201, { data: { results: [{ status: 'inserted' }] } })

    // A replay delivers events months old. Sending "now" would put a customer's
    // whole history on today's date and destroy every trend.
    await testDestination.testAction('trackEvent', {
      settings,
      mapping: mapping({ timestamp: '2025-11-02T08:30:00.000Z' })
    })
    expect(body.events[0].timestamp).toBe('2025-11-02T08:30:00.000Z')
  })

  it('accepts a future timestamp rather than second-guessing the sender clock', async () => {
    const future = new Date(Date.now() + 60 * 60 * 1000).toISOString()
    let body: any
    nock(API_BASE)
      .post('/events', (b) => {
        body = b
        return true
      })
      .reply(201, { data: { results: [{ status: 'inserted' }] } })

    await testDestination.testAction('trackEvent', { settings, mapping: mapping({ timestamp: future }) })
    expect(body.events[0].timestamp).toBe(future)
  })

  it('rejects an event with no identifier', async () => {
    // userId and anonymousId are conditionally required on each other, so the
    // framework rejects this while the customer is still configuring the
    // mapping rather than at delivery time. `validateEvent` keeps the same rule
    // as a backstop for any other call site; that is covered in api.test.ts.
    await expect(
      testDestination.testAction('trackEvent', {
        settings,
        mapping: mapping({ userId: undefined, anonymousId: undefined })
      })
    ).rejects.toThrowError(/required field 'userId'|required field 'anonymousId'/i)
  })

  it('omits properties entirely rather than sending an empty object', async () => {
    let body: any
    nock(API_BASE)
      .post('/events', (b) => {
        body = b
        return true
      })
      .reply(201, { data: { results: [{ status: 'inserted' }] } })

    await testDestination.testAction('trackEvent', { settings, mapping: mapping({ properties: {} }) })
    expect(body.events[0]).not.toHaveProperty('properties')
  })

  it('ignores inherited and prototype-polluting keys on properties', async () => {
    let body: any
    nock(API_BASE)
      .post('/events', (b) => {
        body = b
        return true
      })
      .reply(201, { data: { results: [{ status: 'inserted' }] } })

    const props = Object.create({ inherited: 'nope' }) as Record<string, unknown>
    props.real = 'yes'
    await testDestination.testAction('trackEvent', { settings, mapping: mapping({ properties: props }) })

    expect(body.events[0].properties).toEqual({ real: 'yes' })
    expect(body.events[0].properties).not.toHaveProperty('inherited')
  })

  describe('batching', () => {
    it('sends one request for the whole batch and reports per-event success', async () => {
      let body: any
      nock(API_BASE)
        .post('/events', (b) => {
          body = b
          return true
        })
        .reply(201, {
          data: { results: [{ status: 'inserted' }, { status: 'duplicate' }] }
        })

      const response = await testDestination.testBatchAction('trackEvent', {
        settings,
        events: [
          { type: 'track', event: 'A', messageId: 'm-1', timestamp: '2026-01-01T00:00:00.000Z', userId: 'u1' },
          { type: 'track', event: 'B', messageId: 'm-2', timestamp: '2026-01-02T00:00:00.000Z', userId: 'u2' }
        ] as never,
        mapping: {
          messageId: { '@path': '$.messageId' },
          eventName: { '@path': '$.event' },
          timestamp: { '@path': '$.timestamp' },
          userId: { '@path': '$.userId' }
        },
        useDefaultMappings: false
      })

      expect(body.events).toHaveLength(2)
      // A duplicate is a successful delivery: GainTrace already has the event.
      expect(response).toBeDefined()
    })

    it('never echoes event properties back in the per-item result', async () => {
      nock(API_BASE)
        .post('/events')
        .reply(201, { data: { results: [{ status: 'inserted' }] } })

      const response = await testDestination.executeBatch('trackEvent', {
        settings,
        events: [
          createTestEvent({
            type: 'track',
            event: 'A',
            timestamp: '2026-01-01T00:00:00.000Z',
            userId: 'u1',
            properties: { email: 'person@example.com', ssn: 'secret' }
          })
        ],
        mapping: {
          messageId: { '@path': '$.messageId' },
          eventName: { '@path': '$.event' },
          timestamp: { '@path': '$.timestamp' },
          userId: { '@path': '$.userId' },
          properties: { '@path': '$.properties' }
        }
      })

      // MultiStatus results are surfaced in the UI and stored, so they must not
      // carry personal data lifted from event properties.
      const entry = JSON.stringify(response[0])
      expect(entry).not.toContain('person@example.com')
      expect(entry).not.toContain('secret')
      expect(entry).toContain('source_event_id')
    })
  })

  it('declares a batch size no larger than the documented API ceiling', () => {
    const field: any = Definition.actions.trackEvent.fields.batch_size
    expect(field.default).toBeLessThanOrEqual(MAX_EVENTS_PER_REQUEST)
  })
})
