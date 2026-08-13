import nock from 'nock'
import { createTestEvent, createTestIntegration, SegmentEvent } from '@segment/actions-core'
import GoogleEnhancedConversions from '../index'
import { API_VERSION, CANARY_API_VERSION, FLAGON_NAME } from '../functions'

/**
 * Canary v25 Tests
 * Verifies that when the `google-enhanced-canary-version` feature flag is enabled,
 * all actions route requests to the canary API version (v25) instead of the stable version (v22).
 */

const testDestination = createTestIntegration(GoogleEnhancedConversions)
const timestamp = new Date('Thu Jun 10 2021 11:08:04 GMT-0700 (Pacific Daylight Time)').toISOString()
const customerId = '1234'

describe('Google Enhanced Conversions — Canary v25', () => {
  afterEach(() => {
    nock.cleanAll()
  })

  // ─── uploadClickConversion ────────────────────────────────────────────────

  describe('uploadClickConversion', () => {
    it('single event: uses canary v25 URL when flagon is enabled', async () => {
      const event = createTestEvent({
        timestamp,
        event: 'Test Event',
        properties: {
          gclid: '54321',
          email: 'test@gmail.com',
          orderId: '1234',
          total: '200',
          currency: 'USD'
        }
      })

      nock(`https://googleads.googleapis.com/${CANARY_API_VERSION}/customers/${customerId}:uploadClickConversions`)
        .post('')
        .reply(201, { results: [{}] })

      const responses = await testDestination.testAction('uploadClickConversion', {
        event,
        mapping: { conversion_action: '12345' },
        useDefaultMappings: true,
        settings: { customerId },
        features: { [FLAGON_NAME]: true }
      })

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(201)
      expect(responses[0].url).toContain(CANARY_API_VERSION)
    })

    it('single event: uses stable v22 URL when flagon is disabled', async () => {
      const event = createTestEvent({
        timestamp,
        event: 'Test Event',
        properties: {
          gclid: '54321',
          email: 'test@gmail.com',
          orderId: '1234',
          total: '200',
          currency: 'USD'
        }
      })

      nock(`https://googleads.googleapis.com/${API_VERSION}/customers/${customerId}:uploadClickConversions`)
        .post('')
        .reply(201, { results: [{}] })

      const responses = await testDestination.testAction('uploadClickConversion', {
        event,
        mapping: { conversion_action: '12345' },
        useDefaultMappings: true,
        settings: { customerId },
        features: { [FLAGON_NAME]: false }
      })

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(201)
      expect(responses[0].url).toContain(API_VERSION)
      expect(responses[0].url).not.toContain(CANARY_API_VERSION)
    })

    it('batch event: uses canary v25 URL when flagon is enabled', async () => {
      const events: SegmentEvent[] = [
        createTestEvent({
          timestamp,
          event: 'Test Event 1',
          properties: { gclid: '54321', email: 'test@gmail.com', orderId: '1234', total: '200', currency: 'USD' }
        }),
        createTestEvent({
          timestamp,
          event: 'Test Event 2',
          properties: { gclid: '54322', email: 'test2@gmail.com', orderId: '1235', total: '300', currency: 'USD' }
        })
      ]

      nock(`https://googleads.googleapis.com/${CANARY_API_VERSION}/customers/${customerId}:uploadClickConversions`)
        .post('')
        .reply(201, { results: [{}, {}] })

      const responses = await testDestination.testBatchAction('uploadClickConversion', {
        events,
        mapping: { conversion_action: '12345' },
        useDefaultMappings: true,
        settings: { customerId },
        features: { [FLAGON_NAME]: true }
      })

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(201)
      expect(responses[0].url).toContain(CANARY_API_VERSION)
    })

    it('single event: canary v25 with custom variables uses v25 for searchStream', async () => {
      const event = createTestEvent({
        timestamp,
        event: 'Test Event',
        properties: { gclid: '54321', orderId: '1234', total: '200', currency: 'USD' }
      })

      nock(`https://googleads.googleapis.com/${CANARY_API_VERSION}/customers/${customerId}/googleAds:searchStream`)
        .post('')
        .reply(200, [
          {
            results: [
              {
                conversionCustomVariable: {
                  resourceName: `customers/${customerId}/conversionCustomVariables/123445`,
                  id: '123445',
                  name: 'username'
                }
              }
            ]
          }
        ])

      nock(`https://googleads.googleapis.com/${CANARY_API_VERSION}/customers/${customerId}:uploadClickConversions`)
        .post('')
        .reply(201, { results: [{}] })

      const responses = await testDestination.testAction('uploadClickConversion', {
        event,
        mapping: { conversion_action: '12345', custom_variables: { username: 'spongebob' } },
        useDefaultMappings: true,
        settings: { customerId },
        features: { [FLAGON_NAME]: true }
      })

      expect(responses.length).toBe(2)
      expect(responses[0].url).toContain(CANARY_API_VERSION)
      expect(responses[1].url).toContain(CANARY_API_VERSION)
      expect(responses[1].status).toBe(201)
    })
  })

  // ─── uploadCallConversion ─────────────────────────────────────────────────

  describe('uploadCallConversion', () => {
    it('single event: uses canary v25 URL when flagon is enabled', async () => {
      const event = createTestEvent({
        timestamp,
        event: 'Test Event',
        properties: { total: '200', currency: 'USD' }
      })

      nock(`https://googleads.googleapis.com/${CANARY_API_VERSION}/customers/${customerId}:uploadCallConversions`)
        .post('')
        .reply(201, { results: [{}] })

      const responses = await testDestination.testAction('uploadCallConversion', {
        event,
        mapping: { conversion_action: '12345', caller_id: '+1234567890', call_timestamp: timestamp },
        useDefaultMappings: true,
        settings: { customerId },
        features: { [FLAGON_NAME]: true }
      })

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(201)
      expect(responses[0].url).toContain(CANARY_API_VERSION)
    })

    it('batch event: uses canary v25 URL when flagon is enabled', async () => {
      const events: SegmentEvent[] = [
        createTestEvent({
          timestamp,
          event: 'Test Event 1',
          properties: { total: '200', currency: 'USD' }
        }),
        createTestEvent({
          timestamp,
          event: 'Test Event 2',
          properties: { total: '300', currency: 'USD' }
        })
      ]

      nock(`https://googleads.googleapis.com/${CANARY_API_VERSION}/customers/${customerId}:uploadCallConversions`)
        .post('')
        .reply(201, { results: [{}, {}] })

      const responses = await testDestination.testBatchAction('uploadCallConversion', {
        events,
        mapping: { conversion_action: '12345', caller_id: '+1234567890', call_timestamp: timestamp },
        useDefaultMappings: true,
        settings: { customerId },
        features: { [FLAGON_NAME]: true }
      })

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(201)
      expect(responses[0].url).toContain(CANARY_API_VERSION)
    })
  })

  // ─── uploadConversionAdjustment ───────────────────────────────────────────

  describe('uploadConversionAdjustment', () => {
    it('single event: uses canary v25 URL when flagon is enabled', async () => {
      const event = createTestEvent({
        timestamp,
        event: 'Test Event',
        properties: {
          gclid: '54321',
          email: 'test@gmail.com',
          orderId: '1234',
          currency: 'USD',
          value: '123'
        }
      })

      nock(`https://googleads.googleapis.com/${CANARY_API_VERSION}/customers/${customerId}:uploadConversionAdjustments`)
        .post('')
        .reply(201, { results: [{}] })

      const responses = await testDestination.testAction('uploadConversionAdjustment', {
        event,
        mapping: {
          gclid: { '@path': '$.properties.gclid' },
          conversion_action: '12345',
          adjustment_type: 'ENHANCEMENT',
          conversion_timestamp: { '@path': '$.timestamp' },
          restatement_value: { '@path': '$.properties.value' },
          restatement_currency_code: { '@path': '$.properties.currency' }
        },
        useDefaultMappings: true,
        settings: { customerId },
        features: { [FLAGON_NAME]: true }
      })

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(201)
      expect(responses[0].url).toContain(CANARY_API_VERSION)
    })

    it('batch event: uses canary v25 URL when flagon is enabled', async () => {
      const events: SegmentEvent[] = [
        createTestEvent({
          timestamp,
          event: 'Test Event 1',
          properties: { gclid: '54321', orderId: '1234', currency: 'USD', value: '123' }
        }),
        createTestEvent({
          timestamp,
          event: 'Test Event 2',
          properties: { gclid: '54322', orderId: '1235', currency: 'USD', value: '456' }
        })
      ]

      nock(`https://googleads.googleapis.com/${CANARY_API_VERSION}/customers/${customerId}:uploadConversionAdjustments`)
        .post('')
        .reply(201, { results: [{}, {}] })

      const responses = await testDestination.testBatchAction('uploadConversionAdjustment', {
        events,
        mapping: {
          gclid: { '@path': '$.properties.gclid' },
          conversion_action: '12345',
          adjustment_type: 'ENHANCEMENT',
          conversion_timestamp: { '@path': '$.timestamp' },
          restatement_value: { '@path': '$.properties.value' },
          restatement_currency_code: { '@path': '$.properties.currency' }
        },
        useDefaultMappings: true,
        settings: { customerId },
        features: { [FLAGON_NAME]: true }
      })

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(201)
      expect(responses[0].url).toContain(CANARY_API_VERSION)
    })
  })

  // ─── getApiVersion helper ─────────────────────────────────────────────────

  describe('getApiVersion', () => {
    it('returns CANARY_API_VERSION (v25) when flagon is enabled', async () => {
      expect(CANARY_API_VERSION).toBe('v25')
    })

    it('CANARY_API_VERSION differs from stable API_VERSION', async () => {
      const { API_VERSION } = await import('../functions')
      expect(CANARY_API_VERSION).not.toBe(API_VERSION)
      expect(CANARY_API_VERSION).toBe('v25')
      expect(API_VERSION).toBe('v22')
    })

    it('FLAGON_NAME is the correct feature flag key', () => {
      expect(FLAGON_NAME).toBe('google-enhanced-canary-version')
    })
  })
})
