import nock from 'nock'
import { createTestEvent, createTestIntegration, defaultValues } from '@segment/actions-core'
import Destination from '../../index'
import { BASE_URL } from '../../constants'

const testDestination = createTestIntegration(Destination)
const settings = { aid: 'pixel_123' }

// A recent timestamp so the 7-day validation always passes.
const RECENT_ISO = new Date(Date.now() - 60_000).toISOString()

describe('VibeConversions.trackConversion', () => {
  afterEach(() => {
    nock.cleanAll()
  })

  it('sends a conversion event with required fields', async () => {
    nock(BASE_URL).post('/s2s-conversion/events/segment').reply(200, {})

    const event = createTestEvent({
      type: 'track',
      event: 'Order Completed',
      timestamp: RECENT_ISO,
      properties: { price_usd: 50.5, purchase_id: 'pid_123' }
    })

    const responses = await testDestination.testAction('trackConversion', {
      event,
      settings,
      useDefaultMappings: true,
      mapping: { a: 'purchase' }
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)

    const body = JSON.parse(responses[0].options.body as string)
    expect(body.a).toBe('purchase')
    expect(body.aid).toBe('pixel_123')
    expect(body.eid).toBe(event.messageId)
    expect(body.ip).toBe('8.8.8.8')
    expect(typeof body.ts).toBe('number')
    // Event data is sent as a stringified JSON object.
    expect(body.ed).toBe(JSON.stringify({ price_usd: 50.5, purchase_id: 'pid_123' }))
  })

  it('merges price_usd and purchase_id into the ed object', async () => {
    nock(BASE_URL).post('/s2s-conversion/events/segment').reply(200, {})

    const event = createTestEvent({ timestamp: RECENT_ISO })

    const responses = await testDestination.testAction('trackConversion', {
      event,
      settings,
      useDefaultMappings: true,
      mapping: {
        a: 'purchase',
        ed: { custom: 'value' },
        price_usd: 99.99,
        purchase_id: 'order_777'
      }
    })

    const body = JSON.parse(responses[0].options.body as string)
    expect(JSON.parse(body.ed as string)).toEqual({ custom: 'value', price_usd: 99.99, purchase_id: 'order_777' })
  })

  it('omits ed entirely when there is no event data', async () => {
    nock(BASE_URL).post('/s2s-conversion/events/segment').reply(200, {})

    const event = createTestEvent({ timestamp: RECENT_ISO, properties: {} })

    const responses = await testDestination.testAction('trackConversion', {
      event,
      settings,
      useDefaultMappings: true,
      mapping: { a: 'purchase', ed: {}, price_usd: undefined, purchase_id: undefined }
    })

    const body = JSON.parse(responses[0].options.body as string)
    expect(body.ed).toBeUndefined()
  })

  it('converts an ISO timestamp to UNIX milliseconds', async () => {
    nock(BASE_URL).post('/s2s-conversion/events/segment').reply(200, {})

    const event = createTestEvent({ timestamp: RECENT_ISO })

    const responses = await testDestination.testAction('trackConversion', {
      event,
      settings,
      useDefaultMappings: true,
      mapping: { a: 'page_view' }
    })

    const body = JSON.parse(responses[0].options.body as string)
    expect(body.ts).toBe(new Date(RECENT_ISO).getTime())
  })

  it('uses email when IP is not present', async () => {
    nock(BASE_URL).post('/s2s-conversion/events/segment').reply(200, {})

    const event = createTestEvent({
      timestamp: RECENT_ISO,
      context: { traits: { email: 'joe@gmail.com' } }
    })

    const responses = await testDestination.testAction('trackConversion', {
      event,
      settings,
      useDefaultMappings: true,
      mapping: { a: 'signup', ip: undefined }
    })

    const body = JSON.parse(responses[0].options.body as string)
    expect(body.em).toBe('joe@gmail.com')
    expect(body.ip).toBeUndefined()
  })

  it('throws a PayloadValidationError when both IP and email are missing', async () => {
    const event = createTestEvent({
      timestamp: RECENT_ISO,
      context: {}
    })

    await expect(
      testDestination.testAction('trackConversion', {
        event,
        settings,
        useDefaultMappings: true,
        mapping: { a: 'lead', ip: undefined, em: undefined }
      })
    ).rejects.toThrowError('Either `ip` (IP Address) or `em` (Email) is required.')
  })

  it('throws a PayloadValidationError when the timestamp is older than 7 days', async () => {
    const oldIso = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString()
    const event = createTestEvent({ timestamp: oldIso })

    await expect(
      testDestination.testAction('trackConversion', {
        event,
        settings,
        useDefaultMappings: true,
        mapping: { a: 'purchase' }
      })
    ).rejects.toThrowError('`ts` (timestamp) must be within the last 7 days.')
  })

  it('rejects an invalid event type via the enum choices', async () => {
    const event = createTestEvent({ timestamp: RECENT_ISO })

    await expect(
      testDestination.testAction('trackConversion', {
        event,
        settings,
        useDefaultMappings: true,
        mapping: { a: 'not_a_real_type' }
      })
    ).rejects.toThrowError()
  })

  describe('performBatch', () => {
    it('sends one request per event and marks each as success', async () => {
      // Vibe has no batch endpoint, so each event is its own POST.
      nock(BASE_URL).post('/s2s-conversion/events/segment').times(2).reply(200, {})

      const events = [
        createTestEvent({ timestamp: RECENT_ISO, messageId: 'm1', properties: { price_usd: 10 } }),
        createTestEvent({ timestamp: RECENT_ISO, messageId: 'm2', properties: { price_usd: 20 } })
      ]

      const responses = await testDestination.testBatchAction('trackConversion', {
        events,
        settings,
        useDefaultMappings: true,
        mapping: { a: 'purchase' }
      })

      // Two upstream HTTP calls were made.
      expect(responses.length).toBe(2)
    })

    it('isolates an invalid event without failing the whole batch', async () => {
      nock(BASE_URL).post('/s2s-conversion/events/segment').reply(200, {})

      const goodEvent = createTestEvent({ timestamp: RECENT_ISO, messageId: 'good' })
      // Missing both ip and em -> validation error for this event only.
      const badEvent = createTestEvent({ timestamp: RECENT_ISO, messageId: 'bad', context: {} })

      const mapping = {
        ...defaultValues(Destination.actions.trackConversion.fields),
        a: 'purchase'
      }

      const response = (await testDestination.executeBatch('trackConversion', {
        events: [goodEvent, badEvent],
        settings,
        mapping
      })) as unknown as Array<{ status: number; errortype?: string }>

      expect(response[0].status).toBe(200)
      expect(response[1].status).toBe(400)
      expect(response[1].errortype).toBe('PAYLOAD_VALIDATION_FAILED')
    })
  })
})
