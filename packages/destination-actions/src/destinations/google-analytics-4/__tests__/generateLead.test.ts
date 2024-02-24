import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import ga4 from '../index'
import { DataStreamType } from '../ga4-types'

const testDestination = createTestIntegration(ga4)
const apiSecret = 'b287432uhkjHIUEL'
const measurementId = 'G-TESTTOKEN'
const firebaseAppId = '2:925731738562:android:a9c393108115c5581abc5b'

const testEvent = createTestEvent({
  event: 'Generate Lead',
  userId: 'abc123',
  timestamp: '2022-06-22T22:20:58.905Z',
  anonymousId: 'anon-2134',
  type: 'track',
  properties: {
    product_id: '12345abcde',
    name: 'Quadruple Stack Oreos, 52 ct',
    currency: 'USD',
    price: 12.99,
    quantity: 1
  }
})

describe('GA4', () => {
  describe('Generate Lead', () => {
    it('should append user_properties correctly', async () => {
      nock('https://www.google-analytics.com/mp/collect')
        .post(`?measurement_id=${measurementId}&api_secret=${apiSecret}`)
        .reply(201, {})

      const event = createTestEvent({
        event: 'Generate Lead',
        userId: 'abc123',
        timestamp: '2022-06-22T22:20:58.905Z',
        anonymousId: 'anon-2134',
        type: 'track',
        properties: {
          product_id: '12345abcde',
          name: 'Quadruple Stack Oreos, 52 ct',
          currency: 'USD',
          price: 12.99,
          quantity: 1
        }
      })
      const responses = await testDestination.testAction('generateLead', {
        event,
        settings: {
          apiSecret,
          measurementId
        },
        mapping: {
          client_id: {
            '@path': '$.anonymousId'
          },
          user_properties: {
            hello: 'world',
            a: '1',
            b: '2',
            c: '3'
          }
        },
        useDefaultMappings: true
      })

      expect(responses[0].options.body).toMatchInlineSnapshot(
        `"{\\"client_id\\":\\"anon-2134\\",\\"events\\":[{\\"name\\":\\"generate_lead\\",\\"params\\":{\\"currency\\":\\"USD\\",\\"engagement_time_msec\\":1}}],\\"user_properties\\":{\\"hello\\":{\\"value\\":\\"world\\"},\\"a\\":{\\"value\\":\\"1\\"},\\"b\\":{\\"value\\":\\"2\\"},\\"c\\":{\\"value\\":\\"3\\"}},\\"timestamp_micros\\":1655936458905000}"`
      )
    })

    it('should test handle a basic event', async () => {
      nock('https://www.google-analytics.com/mp/collect')
        .post(`?measurement_id=${measurementId}&api_secret=${apiSecret}`)
        .reply(201, {})

      const event = createTestEvent({
        event: 'Lead Generated',
        userId: 'abc123',
        timestamp: '2022-06-22T22:20:58.905Z',
        type: 'track',
        properties: {
          currency: 'USD',
          value: '300'
        }
      })
      const responses = await testDestination.testAction('generateLead', {
        event,
        settings: {
          apiSecret,
          measurementId
        },
        mapping: {
          client_id: {
            '@path': '$.userId'
          },
          timestamp_micros: {
            '@path': '$.timestamp'
          },
          engagement_time_msec: 2,
          currency: {
            '@path': '$.properties.currency'
          },
          value: {
            '@path': '$.properties.value'
          }
        }
      })

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(201)

      expect(responses[0].request.headers).toMatchInlineSnapshot(`
        Headers {
          Symbol(map): Object {
            "content-type": Array [
              "application/json",
            ],
            "user-agent": Array [
              "Segment (Actions)",
            ],
          },
        }
      `)

      expect(responses[0].options.body).toMatchInlineSnapshot(
        `"{\\"client_id\\":\\"abc123\\",\\"events\\":[{\\"name\\":\\"generate_lead\\",\\"params\\":{\\"currency\\":\\"USD\\",\\"value\\":300,\\"engagement_time_msec\\":2}}],\\"timestamp_micros\\":1655936458905000}"`
      )
    })

    it('should allow currency to be lowercase', async () => {
      nock('https://www.google-analytics.com/mp/collect')
        .post(`?measurement_id=${measurementId}&api_secret=${apiSecret}`)
        .reply(201, {})

      const event = createTestEvent({
        event: 'Lead Generated',
        userId: 'abc123',
        type: 'track',
        properties: {
          currency: 'usd',
          value: '300'
        }
      })
      const responses = await testDestination.testAction('generateLead', {
        event,
        settings: {
          apiSecret,
          measurementId
        },
        mapping: {
          client_id: {
            '@path': '$.userId'
          },
          engagement_time_msec: 2,
          currency: {
            '@path': '$.properties.currency'
          },
          value: {
            '@path': '$.properties.value'
          },
          data_stream_type: DataStreamType.Web
        }
      })

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(201)

      expect(responses[0].request.headers).toMatchInlineSnapshot(`
        Headers {
          Symbol(map): Object {
            "content-type": Array [
              "application/json",
            ],
            "user-agent": Array [
              "Segment (Actions)",
            ],
          },
        }
      `)

      expect(responses[0].options.body).toMatchInlineSnapshot(
        `"{\\"client_id\\":\\"abc123\\",\\"events\\":[{\\"name\\":\\"generate_lead\\",\\"params\\":{\\"currency\\":\\"usd\\",\\"value\\":300,\\"engagement_time_msec\\":2}}]}"`
      )
    })

    it('should throw an error when a value is included with no currency', async () => {
      nock('https://www.google-analytics.com/mp/collect')
        .post(`?measurement_id=${measurementId}&api_secret=${apiSecret}`)
        .reply(201, {})

      const event = createTestEvent({
        event: 'Lead Generated',
        userId: 'abc123',
        type: 'track',
        properties: {
          value: 42
        }
      })
      try {
        await testDestination.testAction('generateLead', {
          event,
          settings: {
            apiSecret,
            measurementId
          },
          mapping: {
            client_id: {
              '@path': '$.userId'
            },
            value: {
              '@path': '$.properties.value'
            },
            data_stream_type: DataStreamType.Web
          },
          useDefaultMappings: true
        })
        fail('the test should have thrown an error')
      } catch (e) {
        expect((e as Error).message).toBe('Currency is required if value is set.')
      }
    })

    it('should handle an empty properties body', async () => {
      nock('https://www.google-analytics.com/mp/collect')
        .post(`?measurement_id=${measurementId}&api_secret=${apiSecret}`)
        .reply(201, {})

      const event = createTestEvent({
        event: 'Lead Generated',
        userId: 'abc123',
        type: 'track'
      })
      const responses = await testDestination.testAction('generateLead', {
        event,
        settings: {
          apiSecret,
          measurementId
        },
        mapping: {
          client_id: {
            '@path': '$.userId'
          },
          data_stream_type: DataStreamType.Web
        }
      })

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(201)

      expect(responses[0].request.headers).toMatchInlineSnapshot(`
        Headers {
          Symbol(map): Object {
            "content-type": Array [
              "application/json",
            ],
            "user-agent": Array [
              "Segment (Actions)",
            ],
          },
        }
      `)

      expect(responses[0].options.body).toMatchInlineSnapshot(
        `"{\\"client_id\\":\\"abc123\\",\\"events\\":[{\\"name\\":\\"generate_lead\\",\\"params\\":{}}]}"`
      )
    })

    it('should throw an error when param value is null', async () => {
      nock('https://www.google-analytics.com/mp/collect')
        .post(`?measurement_id=${measurementId}&api_secret=${apiSecret}`)
        .reply(201, {})

      const event = createTestEvent({
        event: 'Generate Lead',
        userId: 'abc123',
        anonymousId: 'anon-2134',
        type: 'track',
        properties: {
          product_id: '12345abcde',
          name: 'Quadruple Stack Oreos, 52 ct',
          currency: 'USD',
          price: 12.99,
          quantity: 1
        }
      })
      try {
        await testDestination.testAction('generateLead', {
          event,
          settings: {
            apiSecret,
            measurementId
          },
          mapping: {
            client_id: {
              '@path': '$.anonymousId'
            },
            params: {
              test_key: null
            }
          },
          useDefaultMappings: true
        })
        fail('the test should have thrown an error')
      } catch (e) {
        expect((e as Error).message).toBe(
          'Param [test_key] has unsupported value of type [NULL]. GA4 does not accept null, array, or object values for event parameters and item parameters.'
        )
      }
    })

    it('should throw an error when user_properties value is array', async () => {
      nock('https://www.google-analytics.com/mp/collect')
        .post(`?measurement_id=${measurementId}&api_secret=${apiSecret}`)
        .reply(201, {})

      const event = createTestEvent({
        event: 'Generate Lead',
        userId: 'abc123',
        anonymousId: 'anon-2134',
        type: 'track',
        properties: {
          product_id: '12345abcde',
          name: 'Quadruple Stack Oreos, 52 ct',
          currency: 'USD',
          price: 12.99,
          quantity: 1
        }
      })
      try {
        await testDestination.testAction('generateLead', {
          event,
          settings: {
            apiSecret,
            measurementId
          },
          mapping: {
            client_id: {
              '@path': '$.anonymousId'
            },
            user_properties: {
              hello: ['World', 'world']
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
          events: [{ name: 'generate_lead', params: { currency: 'USD', engagement_time_msec: 1 } }],
          timestamp_micros: 1655936458905000
        })
        .reply(201, {})

      await expect(
        testDestination.testAction('generateLead', {
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
        testDestination.testAction('generateLead', {
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
        testDestination.testAction('generateLead', {
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
        testDestination.testAction('generateLead', {
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
        testDestination.testAction('generateLead', {
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

  it('should append consent correctly', async () => {
    nock('https://www.google-analytics.com/mp/collect')
      .post(`?measurement_id=${measurementId}&api_secret=${apiSecret}`)
      .reply(201, {})

    const event = createTestEvent({
      event: 'Generate Lead',
      userId: 'abc123',
      timestamp: '2022-06-22T22:20:58.905Z',
      anonymousId: 'anon-2134',
      type: 'track',
      properties: {
        product_id: '12345abcde',
        name: 'Quadruple Stack Oreos, 52 ct',
        currency: 'USD',
        price: 12.99,
        quantity: 1
      }
    })
    const responses = await testDestination.testAction('generateLead', {
      event,
      settings: {
        apiSecret,
        measurementId
      },
      mapping: {
        client_id: {
          '@path': '$.anonymousId'
        },
        user_properties: {
          hello: 'world',
          a: '1',
          b: '2',
          c: '3'
        },
        ad_user_data_consent: 'GRANTED',
        ad_personalization_consent: 'GRANTED'
      },
      useDefaultMappings: true
    })

    expect(responses[0].options.body).toMatchInlineSnapshot(
      `"{\\"client_id\\":\\"anon-2134\\",\\"events\\":[{\\"name\\":\\"generate_lead\\",\\"params\\":{\\"currency\\":\\"USD\\",\\"engagement_time_msec\\":1}}],\\"user_properties\\":{\\"hello\\":{\\"value\\":\\"world\\"},\\"a\\":{\\"value\\":\\"1\\"},\\"b\\":{\\"value\\":\\"2\\"},\\"c\\":{\\"value\\":\\"3\\"}},\\"timestamp_micros\\":1655936458905000,\\"consent\\":{\\"ad_user_data\\":\\"GRANTED\\",\\"ad_personalization\\":\\"GRANTED\\"}}"`
    )
  })
})
