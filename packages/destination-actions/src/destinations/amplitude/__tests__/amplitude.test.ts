import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Amplitude from '../index'

const testDestination = createTestIntegration(Amplitude)
const timestamp = new Date().toISOString()

describe('Amplitude', () => {
  describe('logEvent', () => {
    it('should work with default mappings', async () => {
      const event = createTestEvent({ timestamp, event: 'Test Event' })

      nock('https://api2.amplitude.com/2').post('/httpapi').reply(200, {})

      const responses = await testDestination.testAction('logEvent', { event, useDefaultMappings: true })
      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(200)
      expect(responses[0].data).toMatchObject({})
      expect(responses[0].options.json).toMatchObject({
        api_key: undefined,
        events: expect.arrayContaining([
          expect.objectContaining({
            event_type: 'Test Event',
            city: 'San Francisco',
            country: 'United States'
          })
        ])
      })
    })

    it('should accept null for user_id', async () => {
      const event = createTestEvent({ timestamp, userId: null, event: 'Null User' })

      nock('https://api2.amplitude.com/2').post('/httpapi').reply(200, {})

      const responses = await testDestination.testAction('logEvent', { event, useDefaultMappings: true })
      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(200)
      expect(responses[0].data).toMatchObject({})
      expect(responses[0].options.json).toMatchObject({
        api_key: undefined,
        events: expect.arrayContaining([
          expect.objectContaining({
            event_type: 'Null User',
            user_id: null
          })
        ])
      })
    })

    it('should work with default mappings', async () => {
      const event = createTestEvent({
        event: 'Order Completed',
        timestamp,
        properties: {
          revenue: 1_999,
          products: [
            {
              quantity: 1,
              productId: 'Bowflex Treadmill 10',
              price: 1_999
            }
          ]
        }
      })

      nock('https://api2.amplitude.com/2').post('/httpapi').reply(200, {})

      const responses = await testDestination.testAction('logEvent', { event, useDefaultMappings: true })
      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(200)
      expect(responses[0].options.json).toMatchObject({
        api_key: undefined,
        events: expect.arrayContaining([
          expect.objectContaining({
            event_type: 'Order Completed',
            revenue: 1_999,
            event_properties: event.properties,
            library: 'segment'
          }),
          expect.objectContaining({
            event_type: 'Product Purchased',
            // @ts-ignore i know what i'm doing
            event_properties: event.properties.products[0],
            library: 'segment'
          })
        ])
      })
    })

    it('should work with per product revenue tracking', async () => {
      nock('https://api2.amplitude.com/2').post('/httpapi').reply(200, {})

      const event = createTestEvent({
        event: 'Order Completed',
        timestamp,
        properties: {
          revenue: 1_999,
          products: [
            {
              quantity: 1,
              productId: 'Bowflex Treadmill 10',
              revenue: 1_999
            }
          ]
        }
      })

      const mapping = {
        trackRevenuePerProduct: true
      }

      const responses = await testDestination.testAction('logEvent', { event, mapping, useDefaultMappings: true })
      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(200)
      expect(responses[0].options.json).toMatchObject({
        api_key: undefined,
        events: expect.arrayContaining([
          expect.objectContaining({
            event_type: 'Order Completed',
            event_properties: event.properties
          }),
          expect.objectContaining({
            event_type: 'Product Purchased',
            revenue: 1_999,
            // @ts-ignore i know what i'm doing
            event_properties: event.properties.products[0]
          })
        ])
      })
    })

    it('should not inject userData if the default mapping is not satisfied and utm / referrer are not provided', async () => {
      const event = createTestEvent({
        timestamp,
        event: 'Test Event',
        traits: {
          'some-trait-key': 'some-trait-value'
        },
        context: {
          'some-context': 'yep'
        }
      })
      nock('https://api2.amplitude.com/2').post('/httpapi').reply(200, {})
      const responses = await testDestination.testAction('logEvent', { event, useDefaultMappings: true })
      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(200)
      expect(responses[0].data).toMatchObject({})

      expect(responses[0].options.json).toMatchObject({
        events: expect.arrayContaining([
          expect.objectContaining({
            event_type: 'Test Event',
            event_properties: {},
            user_properties: {
              'some-trait-key': 'some-trait-value'
            },
            use_batch_endpoint: false
          })
        ])
      })
    })

    it('should support referrer and utm properties in logEvent call to amplitude', async () => {
      const event = createTestEvent({
        timestamp,
        event: 'Test Event',
        traits: {
          'some-trait-key': 'some-trait-value'
        },
        context: {
          page: {
            referrer: 'some-referrer'
          },
          campaign: {
            name: 'TPS Innovation Newsletter',
            source: 'Newsletter',
            medium: 'email',
            term: 'tps reports',
            content: 'image link'
          }
        }
      })
      nock('https://api2.amplitude.com/2').post('/httpapi').reply(200, {})
      const responses = await testDestination.testAction('logEvent', { event, useDefaultMappings: true })
      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(200)
      expect(responses[0].data).toMatchObject({})
      expect(responses[0].options.json).toMatchObject({
        api_key: undefined,
        events: expect.arrayContaining([
          expect.objectContaining({ event_type: 'Test Event' }),
          expect.objectContaining({
            event_type: '$identify',
            user_properties: expect.objectContaining({
              'some-trait-key': 'some-trait-value',
              $set: {
                utm_source: 'Newsletter',
                utm_medium: 'email',
                utm_campaign: 'TPS Innovation Newsletter',
                utm_term: 'tps reports',
                utm_content: 'image link',
                referrer: 'some-referrer'
              },
              $setOnce: {
                initial_utm_source: 'Newsletter',
                initial_utm_medium: 'email',
                initial_utm_campaign: 'TPS Innovation Newsletter',
                initial_utm_term: 'tps reports',
                initial_utm_content: 'image link',
                initial_referrer: 'some-referrer'
              }
            })
          })
        ])
      })
    })
  })

  describe('mapUser', () => {
    it('should work with default mappings', async () => {
      const event = createTestEvent({
        type: 'alias',
        userId: 'some-user-id',
        previousId: 'some-previous-user-id'
      })

      nock('https://api.amplitude.com').post('/usermap').reply(200, {})

      const responses = await testDestination.testAction('mapUser', { event, useDefaultMappings: true })
      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(200)
      expect(responses[0].data).toMatchObject({})
      expect(responses[0].options.body).toMatchInlineSnapshot(`
        URLSearchParams {
          Symbol(query): Array [
            "api_key",
            "undefined",
            "mapping",
            "[{\\"user_id\\":\\"some-previous-user-id\\",\\"global_user_id\\":\\"some-user-id\\"}]",
          ],
          Symbol(context): null,
        }
      `)
    })
  })

  describe('identifyUser', () => {
    it('should work with default mappings', async () => {
      const event = createTestEvent({
        anonymousId: 'some-anonymous-id',
        timestamp: '2021-04-12T16:32:37.710Z',
        type: 'group',
        userId: 'some-user-id',
        traits: {
          'some-trait-key': 'some-trait-value'
        }
      })
      nock('https://api.amplitude.com').post('/identify').reply(200, {})
      const responses = await testDestination.testAction('identifyUser', { event, useDefaultMappings: true })
      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(200)
      expect(responses[0].data).toMatchObject({})
      expect(responses[0].options.body).toMatchInlineSnapshot(`
        URLSearchParams {
          Symbol(query): Array [
            "api_key",
            "undefined",
            "identification",
            "{\\"user_id\\":\\"some-user-id\\",\\"device_id\\":\\"some-anonymous-id\\",\\"country\\":\\"United States\\",\\"city\\":\\"San Francisco\\",\\"language\\":\\"en-US\\",\\"user_properties\\":{\\"some-trait-key\\":\\"some-trait-value\\"},\\"library\\":\\"segment\\"}",
          ],
          Symbol(context): null,
        }
      `)
    })

    it('should support referrer and utm user_properties', async () => {
      const event = createTestEvent({
        anonymousId: 'some-anonymous-id',
        timestamp: '2021-04-12T16:32:37.710Z',
        type: 'group',
        userId: 'some-user-id',
        event: 'Test Event',
        traits: {
          'some-trait-key': 'some-trait-value'
        },
        context: {
          page: {
            referrer: 'some-referrer'
          },
          campaign: {
            name: 'TPS Innovation Newsletter',
            source: 'Newsletter',
            medium: 'email',
            term: 'tps reports',
            content: 'image link'
          }
        }
      })
      nock('https://api.amplitude.com').post('/identify').reply(200, {})
      const responses = await testDestination.testAction('identifyUser', { event, useDefaultMappings: true })
      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(200)
      expect(responses[0].data).toMatchObject({})
      expect(responses[0].options.body).toMatchInlineSnapshot(`
        URLSearchParams {
          Symbol(query): Array [
            "api_key",
            "undefined",
            "identification",
            "{\\"user_id\\":\\"some-user-id\\",\\"device_id\\":\\"some-anonymous-id\\",\\"user_properties\\":{\\"some-trait-key\\":\\"some-trait-value\\",\\"$set\\":{\\"referrer\\":\\"some-referrer\\"},\\"$setOnce\\":{\\"initial_referrer\\":\\"some-referrer\\"}},\\"library\\":\\"segment\\"}",
          ],
          Symbol(context): null,
        }
      `)
    })

    it('shouldnt append $ keys to user_properties if referrer/utm are not specified', async () => {
      const event = createTestEvent({
        anonymousId: 'some-anonymous-id',
        timestamp: '2021-04-12T16:32:37.710Z',
        type: 'group',
        userId: 'some-user-id',
        event: 'Test Event',
        traits: {
          'some-trait-key': 'some-trait-value'
        }
      })
      nock('https://api.amplitude.com').post('/identify').reply(200, {})
      const responses = await testDestination.testAction('identifyUser', { event, useDefaultMappings: true })
      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(200)
      expect(responses[0].data).toMatchObject({})
      expect(responses[0].options.body).toMatchInlineSnapshot(`
        URLSearchParams {
          Symbol(query): Array [
            "api_key",
            "undefined",
            "identification",
            "{\\"user_id\\":\\"some-user-id\\",\\"device_id\\":\\"some-anonymous-id\\",\\"country\\":\\"United States\\",\\"city\\":\\"San Francisco\\",\\"language\\":\\"en-US\\",\\"user_properties\\":{\\"some-trait-key\\":\\"some-trait-value\\"},\\"library\\":\\"segment\\"}",
          ],
          Symbol(context): null,
        }
      `)
    })
  })

  describe('groupIdentifyUser', () => {
    const event = createTestEvent({
      anonymousId: 'some-anonymous-id',
      timestamp: '2021-04-12T16:32:37.710Z',
      type: 'group',
      userId: 'some-user-id',
      traits: {
        'some-trait-key': 'some-trait-value'
      }
    })

    const mapping = {
      insert_id: 'some-insert-id',
      group_type: 'some-type',
      group_value: 'some-value'
    }

    it('should fire identify call to Amplitude', async () => {
      nock('https://api.amplitude.com').post('/identify').reply(200, {})
      nock('https://api.amplitude.com').post('/groupidentify').reply(200, {})

      const [response] = await testDestination.testAction('groupIdentifyUser', {
        event,
        mapping,
        useDefaultMappings: true
      })

      expect(response.status).toBe(200)
      expect(response.data).toMatchObject({})
      expect(response.options.body).toMatchInlineSnapshot(`
        URLSearchParams {
          Symbol(query): Array [
            "api_key",
            "undefined",
            "identification",
            "[{\\"device_id\\":\\"some-anonymous-id\\",\\"groups\\":{\\"some-type\\":\\"some-value\\"},\\"insert_id\\":\\"some-insert-id\\",\\"library\\":\\"segment\\",\\"time\\":1618245157710,\\"user_id\\":\\"some-user-id\\",\\"user_properties\\":{\\"some-type\\":\\"some-value\\"}}]",
          ],
          Symbol(context): null,
        }
      `)
    })

    it('should fire groupidentify call to Amplitude', async () => {
      nock('https://api.amplitude.com').post('/identify').reply(200, {})
      nock('https://api.amplitude.com').post('/groupidentify').reply(200, {})

      const [, response] = await testDestination.testAction('groupIdentifyUser', {
        event,
        mapping,
        useDefaultMappings: true
      })

      expect(response.status).toBe(200)
      expect(response.data).toMatchObject({})
      expect(response.options.body).toMatchInlineSnapshot(`
        URLSearchParams {
          Symbol(query): Array [
            "api_key",
            "undefined",
            "identification",
            "[{\\"group_properties\\":{\\"some-trait-key\\":\\"some-trait-value\\"},\\"group_value\\":\\"some-value\\",\\"group_type\\":\\"some-type\\",\\"library\\":\\"segment\\"}]",
          ],
          Symbol(context): null,
        }
      `)
    })
  })
})
