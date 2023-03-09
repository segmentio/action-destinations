import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import ga4 from '../index'
import { DataStreamType } from '../ga4-types'

const testDestination = createTestIntegration(ga4)
const apiSecret = 'b287432uhkjHIUEL'
const measurementId = 'G-TESTTOKEN'
const firebaseAppId = '2:925731738562:android:a9c393108115c5581abc5b'
const testEvent = createTestEvent({
  event: 'Select Promotion',
  userId: 'abc123',
  timestamp: '2022-06-22T22:20:58.905Z',
  anonymousId: 'anon-2134',
  type: 'track',
  properties: {
    id: '12345abcde',
    name: 'Quadruple Stack Oreos, 52 ct',
    currency: 'USD',
    price: 12.99,
    quantity: 1
  }
})

describe('GA4', () => {
  describe('Select Promotion', () => {
    it('should append user_properties correctly', async () => {
      nock('https://www.google-analytics.com/mp/collect')
        .post(`?measurement_id=${measurementId}&api_secret=${apiSecret}`)
        .reply(201, {})

      const event = createTestEvent({
        event: 'Select Promotion',
        userId: 'abc123',
        timestamp: '2022-06-22T22:20:58.905Z',
        anonymousId: 'anon-2134',
        type: 'track',
        properties: {
          id: '12345abcde',
          name: 'Quadruple Stack Oreos, 52 ct',
          currency: 'USD',
          price: 12.99,
          quantity: 1
        }
      })
      const responses = await testDestination.testAction('selectPromotion', {
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
          user_properties: {
            hello: 'world',
            a: '1',
            b: '2',
            c: '3'
          },
          items: {
            item_id: {
              '@path': '$.properties.id'
            },
            promotion_name: {
              '@path': '$.properties.name'
            }
          }
        },
        useDefaultMappings: true
      })

      expect(responses[0].options.body).toMatchInlineSnapshot(
        `"{\\"client_id\\":\\"anon-2134\\",\\"events\\":[{\\"name\\":\\"select_promotion\\",\\"params\\":{\\"promotion_name\\":\\"Quadruple Stack Oreos, 52 ct\\",\\"items\\":[{\\"item_id\\":\\"12345abcde\\",\\"promotion_name\\":\\"Quadruple Stack Oreos, 52 ct\\"}],\\"engagement_time_msec\\":1}}],\\"user_properties\\":{\\"hello\\":{\\"value\\":\\"world\\"},\\"a\\":{\\"value\\":\\"1\\"},\\"b\\":{\\"value\\":\\"2\\"},\\"c\\":{\\"value\\":\\"3\\"}},\\"timestamp_micros\\":1655936458905000}"`
      )
    })

    it('should handle basic mapping overrides', async () => {
      nock('https://www.google-analytics.com/mp/collect')
        .post(`?measurement_id=${measurementId}&api_secret=${apiSecret}`)
        .reply(201, {})
      const event = createTestEvent({
        event: 'Promotion Clicked',
        userId: '3456fff',
        timestamp: '2022-06-22T22:20:58.905Z',
        anonymousId: 'anon-567890',
        type: 'track',
        properties: {
          id: 'abc',
          promotion_id: 'promo_1',
          creative: 'top_banner_2',
          name: '75% store-wide shoe sale',
          position: 'home_banner_top'
        }
      })
      const responses = await testDestination.testAction('selectPromotion', {
        event,
        settings: {
          apiSecret,
          measurementId
        },
        features: { 'actions-google-analytics-4-add-timestamp': true },
        mapping: {
          client_id: {
            '@path': '$.userId'
          },
          engagement_time_msec: 2,
          location_id: {
            '@path': '$.properties.promotion_id'
          },
          promotion_name: {
            '@path': '$.properties.name'
          },
          creative_slot: {
            '@path': '$.properties.creative'
          },
          promotion_id: {
            '@path': '$.properties.promotion_id'
          },
          timestamp_micros: {
            '@path': '$.timestamp'
          },
          items: {
            item_id: {
              '@path': '$.properties.id'
            },
            promotion_name: {
              '@path': '$.properties.name'
            }
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
        `"{\\"client_id\\":\\"3456fff\\",\\"events\\":[{\\"name\\":\\"select_promotion\\",\\"params\\":{\\"creative_slot\\":\\"top_banner_2\\",\\"location_id\\":\\"promo_1\\",\\"promotion_id\\":\\"promo_1\\",\\"promotion_name\\":\\"75% store-wide shoe sale\\",\\"items\\":[{\\"item_id\\":\\"abc\\",\\"promotion_name\\":\\"75% store-wide shoe sale\\"}],\\"engagement_time_msec\\":2}}],\\"timestamp_micros\\":1655936458905000}"`
      )
    })

    it('should handle complete mapping', async () => {
      nock('https://www.google-analytics.com/mp/collect')
        .post(`?measurement_id=${measurementId}&api_secret=${apiSecret}`)
        .reply(201, {})
      const event = createTestEvent({
        event: 'Promotion Clicked',
        userId: '3456fff',
        timestamp: '2022-06-22T22:20:58.905Z',
        anonymousId: 'anon-567890',
        type: 'track',
        properties: {
          promotion_id: 'promo_1',
          creative: 'top_banner_2',
          creative_slot: '2',
          location: 'home',
          name: '75% store-wide shoe sale',
          position: 'home_banner_top',
          items: [
            {
              item_id: 'SKU_12345',
              item_name: 'jeggings',
              coupon: 'SUMMER_FUN',
              discount: 2.22,
              promotion_id: 'P_12345',
              promotion_name: 'Summer Sale',
              creative_slot: 'featured_app_1',
              location_id: 'L_12345',
              affiliation: 'Google Store',
              item_brand: 'Gucci',
              item_category: 'pants',
              item_variant: 'Black',
              price: 9.99,
              currency: 'USD'
            }
          ]
        }
      })
      const responses = await testDestination.testAction('selectPromotion', {
        event,
        settings: {
          apiSecret,
          measurementId
        },
        features: { 'actions-google-analytics-4-add-timestamp': true },
        mapping: {
          clientId: {
            '@path': '$.anonymousId'
          },
          location_id: {
            '@path': '$.properties.location'
          },
          creative_name: {
            '@path': '$.properties.creative'
          },
          creative_slot: {
            '@path': '$.properties.creative_slot'
          },
          promotion_id: {
            '@path': '$.properties.promotion_id'
          },
          promotion_name: {
            '@path': '$.properties.name'
          },
          items: {
            '@path': '$.properties.items'
          }
        },
        useDefaultMappings: true
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
        `"{\\"client_id\\":\\"3456fff\\",\\"events\\":[{\\"name\\":\\"select_promotion\\",\\"params\\":{\\"creative_name\\":\\"top_banner_2\\",\\"creative_slot\\":\\"2\\",\\"location_id\\":\\"home\\",\\"promotion_id\\":\\"promo_1\\",\\"promotion_name\\":\\"75% store-wide shoe sale\\",\\"items\\":[{\\"item_id\\":\\"SKU_12345\\",\\"item_name\\":\\"jeggings\\",\\"coupon\\":\\"SUMMER_FUN\\",\\"discount\\":2.22,\\"promotion_id\\":\\"P_12345\\",\\"promotion_name\\":\\"Summer Sale\\",\\"creative_slot\\":\\"featured_app_1\\",\\"location_id\\":\\"L_12345\\",\\"affiliation\\":\\"Google Store\\",\\"item_brand\\":\\"Gucci\\",\\"item_category\\":\\"pants\\",\\"item_variant\\":\\"Black\\",\\"price\\":9.99,\\"currency\\":\\"USD\\"}],\\"engagement_time_msec\\":1}}],\\"timestamp_micros\\":1655936458905000}"`
      )
    })

    it('should allow for currency to be lowercase', async () => {
      nock('https://www.google-analytics.com/mp/collect')
        .post(`?measurement_id=${measurementId}&api_secret=${apiSecret}`)
        .reply(201, {})
      const event = createTestEvent({
        event: 'Promotion Clicked',
        userId: '3456fff',
        timestamp: '2022-06-22T22:20:58.905Z',
        anonymousId: 'anon-567890',
        type: 'track',
        properties: {
          promotion_id: 'promo_1',
          creative: 'top_banner_2',
          creative_slot: '2',
          location: 'home',
          name: '75% store-wide shoe sale',
          position: 'home_banner_top',
          items: [
            {
              item_id: 'SKU_12345',
              item_name: 'jeggings',
              coupon: 'SUMMER_FUN',
              discount: 2.22,
              promotion_id: 'P_12345',
              promotion_name: 'Summer Sale',
              creative_slot: 'featured_app_1',
              location_id: 'L_12345',
              affiliation: 'Google Store',
              item_brand: 'Gucci',
              item_category: 'pants',
              item_variant: 'Black',
              price: 9.99,
              currency: 'usd'
            }
          ]
        }
      })
      const responses = await testDestination.testAction('selectPromotion', {
        event,
        settings: {
          apiSecret,
          measurementId
        },
        features: { 'actions-google-analytics-4-add-timestamp': true },
        mapping: {
          clientId: {
            '@path': '$.anonymousId'
          },
          location_id: {
            '@path': '$.properties.location'
          },
          creative_name: {
            '@path': '$.properties.creative'
          },
          creative_slot: {
            '@path': '$.properties.creative_slot'
          },
          promotion_id: {
            '@path': '$.properties.promotion_id'
          },
          promotion_name: {
            '@path': '$.properties.name'
          },
          items: {
            '@path': '$.properties.items'
          }
        },
        useDefaultMappings: true
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
        `"{\\"client_id\\":\\"3456fff\\",\\"events\\":[{\\"name\\":\\"select_promotion\\",\\"params\\":{\\"creative_name\\":\\"top_banner_2\\",\\"creative_slot\\":\\"2\\",\\"location_id\\":\\"home\\",\\"promotion_id\\":\\"promo_1\\",\\"promotion_name\\":\\"75% store-wide shoe sale\\",\\"items\\":[{\\"item_id\\":\\"SKU_12345\\",\\"item_name\\":\\"jeggings\\",\\"coupon\\":\\"SUMMER_FUN\\",\\"discount\\":2.22,\\"promotion_id\\":\\"P_12345\\",\\"promotion_name\\":\\"Summer Sale\\",\\"creative_slot\\":\\"featured_app_1\\",\\"location_id\\":\\"L_12345\\",\\"affiliation\\":\\"Google Store\\",\\"item_brand\\":\\"Gucci\\",\\"item_category\\":\\"pants\\",\\"item_variant\\":\\"Black\\",\\"price\\":9.99,\\"currency\\":\\"usd\\"}],\\"engagement_time_msec\\":1}}],\\"timestamp_micros\\":1655936458905000}"`
      )
    })

    it('should throw error when product name and id is missing', async () => {
      nock('https://www.google-analytics.com/mp/collect')
        .post(`?measurement_id=${measurementId}&api_secret=${apiSecret}`)
        .reply(201, {})
      const event = createTestEvent({
        event: 'Promotion Clicked',
        userId: '3456fff',
        anonymousId: 'anon-567890',
        type: 'track',
        properties: {
          promotion_id: 'promo_1',
          creative: 'top_banner_2',
          name: '75% store-wide shoe sale',
          position: 'home_banner_top',
          items: [
            {
              coupon: 'SUMMER_FUN',
              discount: 2.22,
              promotion_id: 'P_12345',
              promotion_name: 'Summer Sale',
              creative_slot: 'featured_app_1',
              location_id: 'L_12345',
              affiliation: 'Google Store',
              item_brand: 'Gucci',
              item_category: 'pants',
              item_variant: 'Black',
              price: 9.99,
              currency: 'USD'
            }
          ]
        }
      })

      try {
        await testDestination.testAction('selectPromotion', {
          event,
          settings: {
            apiSecret,
            measurementId
          },
          mapping: {
            clientId: {
              '@path': '$.anonymousId'
            },
            location_id: {
              '@path': '$.properties.promotion_id'
            },
            items: {
              '@path': '$.properties.items'
            }
          },
          useDefaultMappings: true
        })
        fail('the test should have thrown an error')
      } catch (e) {
        expect((e as Error).message).toBe(
          'One of product name or product id is required for product or impression data.'
        )
      }
    })

    it('should throw error when item currency is invalid', async () => {
      nock('https://www.google-analytics.com/mp/collect')
        .post(`?measurement_id=${measurementId}&api_secret=${apiSecret}`)
        .reply(201, {})
      const event = createTestEvent({
        event: 'Promotion Clicked',
        userId: '3456fff',
        anonymousId: 'anon-567890',
        type: 'track',
        properties: {
          promotion_id: 'promo_1',
          creative: 'top_banner_2',
          name: '75% store-wide shoe sale',
          position: 'home_banner_top',
          items: [
            {
              item_id: 'SKU_12345',
              item_name: 'jeggings',
              coupon: 'SUMMER_FUN',
              discount: 2.22,
              promotion_id: 'P_12345',
              promotion_name: 'Summer Sale',
              creative_slot: 'featured_app_1',
              location_id: 'L_12345',
              affiliation: 'Google Store',
              item_brand: 'Gucci',
              item_category: 'pants',
              item_variant: 'Black',
              price: 9.99,
              currency: 'US4D'
            }
          ]
        }
      })

      try {
        await testDestination.testAction('selectPromotion', {
          event,
          settings: {
            apiSecret,
            measurementId
          },
          mapping: {
            clientId: {
              '@path': '$.anonymousId'
            },
            location_id: {
              '@path': '$.properties.promotion_id'
            },
            items: {
              '@path': '$.properties.items'
            }
          },
          useDefaultMappings: true
        })
        fail('the test should have thrown an error')
      } catch (e) {
        expect((e as Error).message).toBe('US4D is not a valid currency code.')
      }
    })

    it('should throw an error when params value is null', async () => {
      nock('https://www.google-analytics.com/mp/collect')
        .post(`?measurement_id=${measurementId}&api_secret=${apiSecret}`)
        .reply(201, {})

      const event = createTestEvent({
        event: 'Select Promotion',
        userId: 'abc123',
        anonymousId: 'anon-2134',
        type: 'track',
        properties: {
          id: '12345abcde',
          name: 'Quadruple Stack Oreos, 52 ct',
          currency: 'USD',
          price: 12.99,
          quantity: 1
        }
      })
      try {
        await testDestination.testAction('selectPromotion', {
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
            params: {
              test_value: null
            },
            items: {
              item_id: {
                '@path': '$.properties.id'
              },
              promotion_name: {
                '@path': '$.properties.name'
              }
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
        event: 'Select Promotion',
        userId: 'abc123',
        anonymousId: 'anon-2134',
        type: 'track',
        properties: {
          id: '12345abcde',
          name: 'Quadruple Stack Oreos, 52 ct',
          currency: 'USD',
          price: 12.99,
          quantity: 1
        }
      })
      try {
        await testDestination.testAction('selectPromotion', {
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
            user_properties: {
              hello: ['World', 'world'],
              a: '1',
              b: '2',
              c: '3'
            },
            items: {
              item_id: {
                '@path': '$.properties.id'
              },
              promotion_name: {
                '@path': '$.properties.name'
              }
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
          events: [
            {
              name: 'select_promotion',
              params: {
                promotion_name: 'Quadruple Stack Oreos, 52 ct',
                items: [{ item_name: 'Quadruple Stack Oreos, 52 ct', price: 12.99, quantity: 1 }],
                engagement_time_msec: 1
              }
            }
          ]
        })
        .reply(201, {})

      await expect(
        testDestination.testAction('selectPromotion', {
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
        testDestination.testAction('selectPromotion', {
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
        testDestination.testAction('selectPromotion', {
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
        testDestination.testAction('selectPromotion', {
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
        testDestination.testAction('selectPromotion', {
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
