import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Amplitude from '../index'

const testDestination = createTestIntegration(Amplitude)
const timestamp = '2021-08-17T15:21:15.449Z'

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
          expect.objectContaining({
            event_type: 'Test Event',
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

    it('should support parsing userAgent when the setting is true', async () => {
      const event = createTestEvent({
        anonymousId: '6fd32a7e-3c56-44c2-bd32-62bbec44c53d',
        timestamp,
        event: 'Test Event',
        context: {
          userAgent:
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/53.0.2785.143 Safari/537.36'
        }
      })
      const mapping = {
        userAgentParsing: true
      }
      nock('https://api2.amplitude.com/2').post('/httpapi').reply(200, {})
      const responses = await testDestination.testAction('logEvent', { event, mapping, useDefaultMappings: true })
      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(200)
      expect(responses[0].data).toMatchObject({})
      expect(responses[0].options.json).toMatchInlineSnapshot(`
        Object {
          "api_key": undefined,
          "events": Array [
            Object {
              "device_id": "6fd32a7e-3c56-44c2-bd32-62bbec44c53d",
              "device_model": undefined,
              "device_type": undefined,
              "event_properties": Object {},
              "event_type": "Test Event",
              "library": "segment",
              "os_name": "Chrome",
              "os_version": "53",
              "time": 1629213675449,
              "use_batch_endpoint": false,
              "user_id": "user1234",
              "user_properties": Object {},
            },
          ],
          "options": undefined,
        }
      `)
    })
  })

  it('should not send parsed user agent properties when setting is false', async () => {
    const event = createTestEvent({
      timestamp: '2021-04-12T16:32:37.710Z',
      event: 'Test Event',
      context: {
        device: {
          id: 'foo'
        },
        userAgent:
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/53.0.2785.143 Safari/537.36'
      }
    })
    const mapping = {
      userAgentParsing: false
    }
    nock('https://api2.amplitude.com/2').post('/httpapi').reply(200, {})
    const responses = await testDestination.testAction('logEvent', { event, mapping, useDefaultMappings: true })
    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect(responses[0].data).toMatchObject({})
    expect(responses[0].options.json).toMatchInlineSnapshot(`
      Object {
        "api_key": undefined,
        "events": Array [
          Object {
            "device_id": "foo",
            "event_properties": Object {},
            "event_type": "Test Event",
            "idfv": "foo",
            "library": "segment",
            "time": 1618245157710,
            "use_batch_endpoint": false,
            "user_id": "user1234",
            "user_properties": Object {},
          },
        ],
        "options": undefined,
      }
    `)
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
            "{\\"os_name\\":\\"Mobile Safari\\",\\"os_version\\":\\"9\\",\\"device_model\\":\\"iPhone\\",\\"device_type\\":\\"mobile\\",\\"user_id\\":\\"some-user-id\\",\\"device_id\\":\\"some-anonymous-id\\",\\"user_properties\\":{\\"some-trait-key\\":\\"some-trait-value\\"},\\"country\\":\\"United States\\",\\"city\\":\\"San Francisco\\",\\"language\\":\\"en-US\\",\\"library\\":\\"segment\\"}",
            "options",
            "undefined",
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
            "{\\"user_id\\":\\"some-user-id\\",\\"device_id\\":\\"some-anonymous-id\\",\\"user_properties\\":{\\"some-trait-key\\":\\"some-trait-value\\",\\"$set\\":{\\"utm_source\\":\\"Newsletter\\",\\"utm_medium\\":\\"email\\",\\"utm_campaign\\":\\"TPS Innovation Newsletter\\",\\"utm_term\\":\\"tps reports\\",\\"utm_content\\":\\"image link\\",\\"referrer\\":\\"some-referrer\\"},\\"$setOnce\\":{\\"initial_utm_source\\":\\"Newsletter\\",\\"initial_utm_medium\\":\\"email\\",\\"initial_utm_campaign\\":\\"TPS Innovation Newsletter\\",\\"initial_utm_term\\":\\"tps reports\\",\\"initial_utm_content\\":\\"image link\\",\\"initial_referrer\\":\\"some-referrer\\"}},\\"library\\":\\"segment\\"}",
            "options",
            "undefined",
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
            "{\\"os_name\\":\\"Mobile Safari\\",\\"os_version\\":\\"9\\",\\"device_model\\":\\"iPhone\\",\\"device_type\\":\\"mobile\\",\\"user_id\\":\\"some-user-id\\",\\"device_id\\":\\"some-anonymous-id\\",\\"user_properties\\":{\\"some-trait-key\\":\\"some-trait-value\\"},\\"country\\":\\"United States\\",\\"city\\":\\"San Francisco\\",\\"language\\":\\"en-US\\",\\"library\\":\\"segment\\"}",
            "options",
            "undefined",
          ],
          Symbol(context): null,
        }
      `)
    })

    it('should support parsing userAgent when the setting is true', async () => {
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
          device: {
            id: 'foo'
          },
          userAgent:
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/53.0.2785.143 Safari/537.36'
        }
      })

      const mapping = {
        userAgentParsing: true
      }

      nock('https://api.amplitude.com').post('/identify').reply(200, {})
      const responses = await testDestination.testAction('identifyUser', { event, mapping, useDefaultMappings: true })
      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(200)
      expect(responses[0].data).toMatchObject({})
      expect(responses[0].options.body).toMatchInlineSnapshot(`
        URLSearchParams {
          Symbol(query): Array [
            "api_key",
            "undefined",
            "identification",
            "{\\"os_name\\":\\"Chrome\\",\\"os_version\\":\\"53\\",\\"user_id\\":\\"some-user-id\\",\\"device_id\\":\\"foo\\",\\"user_properties\\":{\\"some-trait-key\\":\\"some-trait-value\\"},\\"library\\":\\"segment\\"}",
            "options",
            "undefined",
          ],
          Symbol(context): null,
        }
      `)
    })
    it('should not send parsed user agent properties when setting is false', async () => {
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
          device: {
            id: 'foo'
          },
          userAgent:
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/53.0.2785.143 Safari/537.36'
        }
      })

      const mapping = {
        userAgentParsing: false
      }

      nock('https://api.amplitude.com').post('/identify').reply(200, {})
      const responses = await testDestination.testAction('identifyUser', { event, mapping, useDefaultMappings: true })
      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(200)
      expect(responses[0].data).toMatchObject({})
      expect(responses[0].options.body).toMatchInlineSnapshot(`
        URLSearchParams {
          Symbol(query): Array [
            "api_key",
            "undefined",
            "identification",
            "{\\"user_id\\":\\"some-user-id\\",\\"device_id\\":\\"foo\\",\\"user_properties\\":{\\"some-trait-key\\":\\"some-trait-value\\"},\\"library\\":\\"segment\\"}",
            "options",
            "undefined",
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
            "options",
            "undefined",
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
            "options",
            "undefined",
          ],
          Symbol(context): null,
        }
      `)
    })
  })
})
