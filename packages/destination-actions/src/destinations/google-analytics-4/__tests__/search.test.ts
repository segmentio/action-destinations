import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import ga4 from '../index'
import { DataStreamType } from '../ga4-types'

const testDestination = createTestIntegration(ga4)
const apiSecret = 'b287432uhkjHIUEL'
const measurementId = 'G-TESTTOKEN'
const firebaseAppId = '2:925731738562:android:a9c393108115c5581abc5b'

const testEvent = createTestEvent({
  event: 'Search',
  userId: 'abc123',
  timestamp: '2022-06-22T22:20:58.905Z',
  anonymousId: 'anon-2134',
  type: 'track',
  properties: {
    product_id: '12345abcde',
    query: 'Quadruple Stack Oreos, 52 ct',
    currency: 'USD',
    price: 12.99,
    quantity: 1
  }
})

describe('GA4', () => {
  describe('Products Searched', () => {
    it('should append user_properties correctly', async () => {
      nock('https://www.google-analytics.com/mp/collect')
        .post(`?measurement_id=${measurementId}&api_secret=${apiSecret}`)
        .reply(201, {})

      const event = createTestEvent({
        event: 'Search',
        userId: 'abc123',
        timestamp: '2022-06-22T22:20:58.905Z',
        anonymousId: 'anon-2134',
        type: 'track',
        properties: {
          product_id: '12345abcde',
          query: 'Quadruple Stack Oreos, 52 ct',
          currency: 'USD',
          price: 12.99,
          quantity: 1
        }
      })
      const responses = await testDestination.testAction('search', {
        event,
        settings: {
          apiSecret,
          measurementId
        },
        features: { 'actions-google-analytics-4-add-timestamp': true },
        mapping: {
          client_id: {
            '@path': '$.anonymousId'
          },
          engagement_time_msec: 2,
          user_properties: {
            hello: 'world',
            a: '1',
            b: '2',
            c: '3'
          },
          search_term: {
            '@path': '$.properties.query'
          },
          timestamp_micros: {
            '@path': '$.timestamp'
          }
        },
        useDefaultMappings: false
      })

      expect(responses[0].options.body).toMatchInlineSnapshot(
        `"{\\"client_id\\":\\"anon-2134\\",\\"events\\":[{\\"name\\":\\"search\\",\\"params\\":{\\"search_term\\":\\"Quadruple Stack Oreos, 52 ct\\",\\"engagement_time_msec\\":2}}],\\"user_properties\\":{\\"hello\\":{\\"value\\":\\"world\\"},\\"a\\":{\\"value\\":\\"1\\"},\\"b\\":{\\"value\\":\\"2\\"},\\"c\\":{\\"value\\":\\"3\\"}},\\"timestamp_micros\\":1655936458905000}"`
      )
    })

    //basic event test
    it('should handle a basic event with default mappings', async () => {
      nock('https://www.google-analytics.com/mp/collect')
        .post(`?measurement_id=${measurementId}&api_secret=${apiSecret}`)
        .reply(201, {})
      const event = createTestEvent({
        event: 'Products Searched',
        userId: '3456fff',
        timestamp: '2022-06-22T22:20:58.905Z',
        type: 'track',
        properties: {
          query: 'milk and cookies'
        }
      })
      const responses = await testDestination.testAction('search', {
        event,
        settings: {
          apiSecret,
          measurementId
        },
        features: { 'actions-google-analytics-4-add-timestamp': true },
        useDefaultMappings: true
      })

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(201)

      expect(responses[0].options.body).toMatchInlineSnapshot(
        `"{\\"client_id\\":\\"3456fff\\",\\"events\\":[{\\"name\\":\\"search\\",\\"params\\":{\\"search_term\\":\\"milk and cookies\\",\\"engagement_time_msec\\":1}}],\\"timestamp_micros\\":1655936458905000}"`
      )
    })

    //event without query term event
    it('should throw an error for an empty search term', async () => {
      nock('https://www.google-analytics.com/mp/collect')
        .post(`?measurement_id=${measurementId}&api_secret=${apiSecret}`)
        .reply(201, {})
      const event = createTestEvent({
        event: 'Products Searched',
        userId: '3456fff',
        type: 'track'
      })
      try {
        await testDestination.testAction('search', {
          event,
          settings: {
            apiSecret,
            measurementId
          },
          useDefaultMappings: true
        })
        fail('the test should have thrown an error')
      } catch (e) {
        expect((e as Error).message).toBe("The root value is missing the required field 'search_term'.")
      }
    })

    it('should throw an error when param value is null', async () => {
      nock('https://www.google-analytics.com/mp/collect')
        .post(`?measurement_id=${measurementId}&api_secret=${apiSecret}`)
        .reply(201, {})

      const event = createTestEvent({
        event: 'Search',
        userId: 'abc123',
        anonymousId: 'anon-2134',
        type: 'track',
        properties: {
          product_id: '12345abcde',
          query: 'Quadruple Stack Oreos, 52 ct',
          currency: 'USD',
          price: 12.99,
          quantity: 1
        }
      })
      try {
        await testDestination.testAction('search', {
          event,
          settings: {
            apiSecret,
            measurementId
          },
          features: { 'actions-google-analytics-4-verify-params-feature': true },
          mapping: {
            client_id: {
              '@path': '$.anonymousId'
            },
            engagement_time_msec: 2,
            params: {
              test_value: null
            }
          },
          useDefaultMappings: true
        })
        fail('the test should have thrown an error')
      } catch (e) {
        expect((e as Error).message).toBe(
          'Param [test_value] has unsupported value of type [NULL]. GA4 does not accept null, array, or object values for event parameters and item parameters.'
        )
      }
    })

    it('should throw an error when user_properties value is array', async () => {
      nock('https://www.google-analytics.com/mp/collect')
        .post(`?measurement_id=${measurementId}&api_secret=${apiSecret}`)
        .reply(201, {})

      const event = createTestEvent({
        event: 'Search',
        userId: 'abc123',
        anonymousId: 'anon-2134',
        type: 'track',
        properties: {
          product_id: '12345abcde',
          query: 'Quadruple Stack Oreos, 52 ct',
          currency: 'USD',
          price: 12.99,
          quantity: 1
        }
      })
      try {
        await testDestination.testAction('search', {
          event,
          settings: {
            apiSecret,
            measurementId
          },
          features: { 'actions-google-analytics-4-verify-params-feature': true },
          mapping: {
            client_id: {
              '@path': '$.anonymousId'
            },
            engagement_time_msec: 2,
            user_properties: {
              hello: ['World', 'world'],
              a: '1',
              b: '2',
              c: '3'
            }
          },
          useDefaultMappings: true
        })
        fail('the test should have thrown an error')
      } catch (e) {
        expect((e as Error).message).toBe(
          'Param [hello] has unsupported value of type [Array]. GA4 does not accept array or object values for user properties.'
        )
      }
    })

    it('should use mobile stream params when datastream is mobile app', async () => {
      nock('https://www.google-analytics.com/mp/collect')
        .post(`?api_secret=${apiSecret}&firebase_app_id=${firebaseAppId}`, {
          app_instance_id: 'anon-2134',
          events: [{ name: 'search', params: { search_term: 'Quadruple Stack Oreos, 52 ct', engagement_time_msec: 1 } }]
        })
        .reply(201, {})

      await expect(
        testDestination.testAction('search', {
          event: testEvent,
          settings: {
            apiSecret,
            firebaseAppId
          },
          mapping: {
            data_stream_type: DataStreamType.MobileApp,
            app_instance_id: {
              '@path': '$.anonymousId'
            }
          },
          useDefaultMappings: true
        })
      ).resolves.not.toThrowError()
    })

    it('should throw error when data stream type is mobile app and firebase_app_id is not provided', async () => {
      await expect(
        testDestination.testAction('search', {
          event: testEvent,
          settings: {
            apiSecret
          },
          mapping: {
            data_stream_type: DataStreamType.MobileApp,
            app_instance_id: {
              '@path': '$.anonymousId'
            }
          },
          useDefaultMappings: true
        })
      ).rejects.toThrowError('Firebase App ID is required for mobile app streams')
    })

    it('should throw error when data stream type is mobile app and app_instance_id is not provided', async () => {
      await expect(
        testDestination.testAction('search', {
          event: testEvent,
          settings: {
            apiSecret,
            firebaseAppId
          },
          mapping: {
            data_stream_type: DataStreamType.MobileApp
          },
          useDefaultMappings: true
        })
      ).rejects.toThrowError('Firebase App Instance ID is required for mobile app streams')
    })

    it('should throw error when data stream type is web and measurement_id is not provided', async () => {
      await expect(
        testDestination.testAction('search', {
          event: testEvent,
          settings: {
            apiSecret
          },
          useDefaultMappings: true
        })
      ).rejects.toThrowError('Measurement ID is required for web streams')
    })

    it('should throw error when data stream type is web and client_id is not provided', async () => {
      await expect(
        testDestination.testAction('search', {
          event: testEvent,
          settings: {
            apiSecret,
            measurementId
          },
          mapping: {
            client_id: {
              '@path': '$.traits.dummy'
            }
          },
          useDefaultMappings: true
        })
      ).rejects.toThrowError('Client ID is required for web streams')
    })
  })
})
