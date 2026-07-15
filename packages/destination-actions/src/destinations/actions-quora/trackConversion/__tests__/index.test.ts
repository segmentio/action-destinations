import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'
import { BASE_URL } from '../constants'

const testDestination = createTestIntegration(Destination)

const settings = {
  api_token: 'test-token',
  account_id: '527745581653587'
}

describe('Quora Conversions API - trackConversion', () => {
  afterEach(() => {
    nock.cleanAll()
  })

  it('sends a single conversion to the single endpoint', async () => {
    nock(BASE_URL).post('/ads/v0/conversion').reply(200, { events_received: 1, events_errored: 0 })

    const event = createTestEvent({
      type: 'track',
      event: 'Order Completed',
      timestamp: '2023-09-26T15:29:30.036Z',
      messageId: 'evt-001',
      properties: { qclid: '0%7C212106239366182%7C0', value: 5.99 },
      context: {
        traits: { email: 'user@quora.com', name: 'John Smith' },
        ip: '127.0.0.1',
        page: { referrer: 'https://example.com' }
      }
    })

    const responses = await testDestination.testAction('trackConversion', {
      event,
      settings,
      mapping: { event_name: 'Purchase' },
      useDefaultMappings: true
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)

    const body = responses[0].options.json as Record<string, unknown>
    expect(body.account_id).toBe(527745581653587)
    expect((body.conversion as Record<string, unknown>).event_name).toBe('Purchase')
    expect((body.conversion as Record<string, unknown>).click_id).toBe('0%7C212106239366182%7C0')
    expect((body.conversion as Record<string, unknown>).value).toBe(5.99)
    // timestamp converted to epoch microseconds
    expect((body.conversion as Record<string, unknown>).timestamp).toBe(1695742170036000)
    expect((body.user as Record<string, unknown>).email).toBe('user@quora.com')
    expect((body.device as Record<string, unknown>).referer).toBe('https://example.com')
  })

  it('passes the Segment event name through as the Quora event_name', async () => {
    nock(BASE_URL).post('/ads/v0/conversion').reply(200, { events_received: 1, events_errored: 0 })

    const event = createTestEvent({ type: 'track', event: 'Custom Thing', properties: {} })

    const responses = await testDestination.testAction('trackConversion', {
      event,
      settings,
      mapping: { event_name: { '@path': '$.event' } },
      useDefaultMappings: true
    })

    const body = responses[0].options.json as Record<string, unknown>
    expect((body.conversion as Record<string, unknown>).event_name).toBe('Custom Thing')
  })

  it('throws when the single event is rejected in the 200 body', async () => {
    nock(BASE_URL)
      .post('/ads/v0/conversion')
      .reply(200, {
        events_received: 1,
        events_errored: 1,
        events: [{ status: 'ERROR', index: 0, error_code: 'VALUE_OUT_OF_RANGE', error_message: 'bad value' }]
      })

    const event = createTestEvent({ type: 'track', event: 'Order Completed', properties: {} })

    await expect(
      testDestination.testAction('trackConversion', {
        event,
        settings,
        mapping: { event_name: 'Purchase' },
        useDefaultMappings: true
      })
    ).rejects.toThrow('bad value')
  })

  it('sends a batch to the batch endpoint with account_id hoisted to root', async () => {
    let captured: Record<string, unknown> = {}
    nock(BASE_URL)
      .post('/ads/v0/conversions', (b) => {
        captured = b
        return true
      })
      .reply(200, { events_received: 2, events_errored: 0, events: [] })

    const events = [
      createTestEvent({ type: 'track', event: 'Order Completed', properties: { value: 1 } }),
      createTestEvent({ type: 'track', event: 'Order Completed', properties: { value: 2 } })
    ]

    const responses = await testDestination.testBatchAction('trackConversion', {
      events,
      settings,
      mapping: { event_name: 'Purchase' },
      useDefaultMappings: true
    })

    expect(captured.account_id).toBe(527745581653587)
    expect(Array.isArray(captured.data)).toBe(true)
    expect((captured.data as unknown[]).length).toBe(2)
    // account_id is not repeated inside each item
    expect((captured.data as Record<string, unknown>[])[0].account_id).toBeUndefined()
    expect(responses[0].status).toBe(200)
  })
})
