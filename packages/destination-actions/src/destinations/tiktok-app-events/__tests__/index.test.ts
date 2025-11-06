import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Definition from '../index'
import { Settings } from '../generated-types'
import { VEHICLE_FIELDS, TRAVEL_FIELDS } from '../reportAppEvent/constants'

let testDestination = createTestIntegration(Definition)
const timestamp = '2024-01-08T13:52:50.212Z'
const settings: Settings = {
  accessToken: 'test',
  pixelCode: 'test'
}

describe('Tiktok Conversions', () => {
  describe('reportWebEvent', () => {
    beforeEach(() => {
      jest.clearAllMocks()
      nock.cleanAll()
      testDestination = createTestIntegration(Definition)
    })

    it('should send a successful InitiateCheckout event to reportWebEvent', async () => {
      const event = createTestEvent({
        timestamp: timestamp,
        event: 'Checkout Started',
        messageId: 'corey123',
        type: 'track',
        properties: {
          email: 'coreytest1231@gmail.com',
          phone: '+1555-555-5555',
          ttclid: '12345',
          currency: 'USD',
          value: 100,
          query: 'shoes'
        },
        context: {
          page: {
            url: 'https://segment.com/',
            referrer: 'https://google.com/'
          },
          userAgent:
            'Mozilla/5.0 (iPhone; CPU iPhone OS 12_1_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/16D57',
          ip: '0.0.0.0'
        },
        userId: 'testId123'
      })

      nock('https://business-api.tiktok.com/open_api/v1.3/event/track').post('/').reply(200, {})
      const responses = await testDestination.testAction('reportWebEvent', {
        event,
        settings,
        useDefaultMappings: true,
        mapping: {
          event: 'InitiateCheckout'
        }
      })

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(200)
      expect(responses[0].options.json).toMatchObject({
        data: [
          {
            event: 'InitiateCheckout',
            event_id: 'corey123',
            event_time: 1704721970,
            limited_data_use: false,
            page: {
              referrer: 'https://google.com/',
              url: 'https://segment.com/'
            },
            properties: {
              content_type: 'product',
              contents: [],
              currency: 'USD',
              query: 'shoes',
              value: 100
            },
            user: {
              email: ['eb9869a32b532840dd6aa714f7a872d21d6f650fc5aa933d9feefc64708969c7'],
              external_id: ['481f202262e9c5ccc48d24e60798fadaa5f6ff1f8369f7ab927c04c3aa682a7f'],
              ip: '0.0.0.0',
              phone: ['910a625c4ba147b544e6bd2f267e130ae14c591b6ba9c25cb8573322dedbebd0'],
              ttclid: '12345',
              user_agent:
                'Mozilla/5.0 (iPhone; CPU iPhone OS 12_1_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/16D57'
            }
          }
        ],
        event_source: 'web',
        event_source_id: 'test',
        partner_name: 'Segment'
      })
    })

    it('should send contents array properties to TikTok', async () => {
      const event = createTestEvent({
        timestamp: timestamp,
        event: 'Checkout Started',
        messageId: 'corey123',
        type: 'track',
        properties: {
          email: 'coreytest1231@gmail.com',
          phone: '+1555-555-5555',
          ttclid: '12345',
          currency: 'USD',
          value: 100,
          query: 'shoes',
          products: [
            {
              price: 100,
              quantity: 2,
              category: 'Air Force One (Size S)',
              product_id: 'abc123',
              name: 'pname1',
              brand: 'Brand X'
            }
          ]
        },
        context: {
          page: {
            url: 'https://segment.com/',
            referrer: 'https://google.com/'
          },
          userAgent:
            'Mozilla/5.0 (iPhone; CPU iPhone OS 12_1_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/16D57',
          ip: '0.0.0.0'
        },
        userId: 'testId123'
      })

      nock('https://business-api.tiktok.com/open_api/v1.3/event/track').post('/').reply(200, {})
      const responses = await testDestination.testAction('reportWebEvent', {
        event,
        settings,
        useDefaultMappings: true,
        mapping: {
          event: 'InitiateCheckout',
          contents: {
            '@arrayPath': [
              '$.properties.products',
              {
                price: {
                  '@path': '$.price'
                },
                quantity: {
                  '@path': '$.quantity'
                },
                content_category: {
                  '@path': '$.category'
                },
                content_id: {
                  '@path': '$.product_id'
                },
                content_name: {
                  '@path': '$.name'
                },
                brand: {
                  '@path': '$.brand'
                }
              }
            ]
          }
        }
      })

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(200)
      expect(responses[0].options.json).toMatchObject({
        data: [
          {
            event: 'InitiateCheckout',
            event_id: 'corey123',
            event_time: 1704721970,
            limited_data_use: false,
            page: {
              referrer: 'https://google.com/',
              url: 'https://segment.com/'
            },
            properties: {
              content_type: 'product',
              contents: [
                {
                  price: 100,
                  quantity: 2,
                  content_id: 'abc123',
                  content_category: 'Air Force One (Size S)',
                  content_name: 'pname1',
                  brand: 'Brand X'
                }
              ],
              currency: 'USD',
              query: 'shoes',
              value: 100
            },
            user: {
              email: ['eb9869a32b532840dd6aa714f7a872d21d6f650fc5aa933d9feefc64708969c7'],
              external_id: ['481f202262e9c5ccc48d24e60798fadaa5f6ff1f8369f7ab927c04c3aa682a7f'],
              ip: '0.0.0.0',
              phone: ['910a625c4ba147b544e6bd2f267e130ae14c591b6ba9c25cb8573322dedbebd0'],
              ttclid: '12345',
              user_agent:
                'Mozilla/5.0 (iPhone; CPU iPhone OS 12_1_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/16D57'
            }
          }
        ],
        event_source: 'web',
        event_source_id: 'test',
        partner_name: 'Segment'
      })
    })

    it('should coerce properties into the contents array', async () => {
      const event = createTestEvent({
        timestamp: timestamp,
        event: 'Checkout Started',
        messageId: 'corey123',
        type: 'track',
        properties: {
          email: 'coreytest1231@gmail.com',
          phone: '+1555-555-5555',
          ttclid: '12345',
          currency: 'USD',
          value: 100,
          query: 'shoes',
          price: 100,
          quantity: 2,
          category: 'Air Force One (Size S)',
          product_id: 'abc123',
          name: 'pname1',
          brand: 'Brand X'
        },
        context: {
          page: {
            url: 'https://segment.com/',
            referrer: 'https://google.com/'
          },
          userAgent:
            'Mozilla/5.0 (iPhone; CPU iPhone OS 12_1_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/16D57',
          ip: '0.0.0.0'
        },
        userId: 'testId123'
      })

      nock('https://business-api.tiktok.com/open_api/v1.3/event/track').post('/').reply(200, {})
      const responses = await testDestination.testAction('reportWebEvent', {
        event,
        settings,
        useDefaultMappings: true,
        mapping: {
          event: 'AddToCart',
          contents: {
            '@arrayPath': [
              '$.properties',
              {
                price: {
                  '@path': '$.price'
                },
                quantity: {
                  '@path': '$.quantity'
                },
                content_category: {
                  '@path': '$.category'
                },
                content_id: {
                  '@path': '$.product_id'
                },
                content_name: {
                  '@path': '$.name'
                },
                brand: {
                  '@path': '$.brand'
                }
              }
            ]
          }
        }
      })

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(200)
      expect(responses[0].options.json).toMatchObject({
        data: [
          {
            event: 'AddToCart',
            event_id: 'corey123',
            event_time: 1704721970,
            limited_data_use: false,
            page: {
              referrer: 'https://google.com/',
              url: 'https://segment.com/'
            },
            properties: {
              content_type: 'product',
              contents: [
                {
                  price: 100,
                  quantity: 2,
                  content_id: 'abc123',
                  content_category: 'Air Force One (Size S)',
                  content_name: 'pname1',
                  brand: 'Brand X'
                }
              ],
              currency: 'USD',
              query: 'shoes',
              value: 100
            },
            user: {
              email: ['eb9869a32b532840dd6aa714f7a872d21d6f650fc5aa933d9feefc64708969c7'],
              external_id: ['481f202262e9c5ccc48d24e60798fadaa5f6ff1f8369f7ab927c04c3aa682a7f'],
              ip: '0.0.0.0',
              phone: ['910a625c4ba147b544e6bd2f267e130ae14c591b6ba9c25cb8573322dedbebd0'],
              ttclid: '12345',
              user_agent:
                'Mozilla/5.0 (iPhone; CPU iPhone OS 12_1_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/16D57'
            }
          }
        ],
        event_source: 'web',
        event_source_id: 'test',
        partner_name: 'Segment'
      })
    })

    it('should parse context.page.url ttclid if properties.ttclid not available', async () => {
      const event = createTestEvent({
        timestamp: timestamp,
        event: 'Checkout Started',
        messageId: 'corey123',
        type: 'track',
        properties: {
          email: 'coreytest1231@gmail.com',
          phone: '+1555-555-5555',
          currency: 'USD',
          value: 100,
          query: 'shoes',
          price: 100,
          quantity: 2,
          category: 'Air Force One (Size S)',
          product_id: 'abc123',
          name: 'pname1',
          brand: 'Brand X'
        },
        context: {
          page: {
            url: 'http://demo.mywebsite.com?a=b&ttclid=123ATXSfe',
            referrer: 'https://google.com/'
          },
          userAgent:
            'Mozilla/5.0 (iPhone; CPU iPhone OS 12_1_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/16D57',
          ip: '0.0.0.0'
        },
        userId: 'testId123'
      })

      nock('https://business-api.tiktok.com/open_api/v1.3/event/track').post('/').reply(200, {})
      const responses = await testDestination.testAction('reportWebEvent', {
        event,
        settings,
        useDefaultMappings: true,
        mapping: {
          event: 'AddToCart',
          contents: {
            '@arrayPath': [
              '$.properties',
              {
                price: {
                  '@path': '$.price'
                },
                quantity: {
                  '@path': '$.quantity'
                },
                content_category: {
                  '@path': '$.category'
                },
                content_id: {
                  '@path': '$.product_id'
                },
                content_name: {
                  '@path': '$.name'
                },
                brand: {
                  '@path': '$.brand'
                }
              }
            ]
          }
        }
      })

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(200)
      expect(responses[0].options.json).toMatchObject({
        data: [
          {
            event: 'AddToCart',
            event_id: 'corey123',
            event_time: 1704721970,
            limited_data_use: false,
            page: {
              referrer: 'https://google.com/',
              url: 'http://demo.mywebsite.com?a=b&ttclid=123ATXSfe'
            },
            properties: {
              content_type: 'product',
              contents: [
                {
                  price: 100,
                  quantity: 2,
                  content_id: 'abc123',
                  content_category: 'Air Force One (Size S)',
                  content_name: 'pname1',
                  brand: 'Brand X'
                }
              ],
              currency: 'USD',
              query: 'shoes',
              value: 100
            },
            user: {
              email: ['eb9869a32b532840dd6aa714f7a872d21d6f650fc5aa933d9feefc64708969c7'],
              external_id: ['481f202262e9c5ccc48d24e60798fadaa5f6ff1f8369f7ab927c04c3aa682a7f'],
              ip: '0.0.0.0',
              phone: ['910a625c4ba147b544e6bd2f267e130ae14c591b6ba9c25cb8573322dedbebd0'],
              ttclid: '123ATXSfe',
              user_agent:
                'Mozilla/5.0 (iPhone; CPU iPhone OS 12_1_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/16D57'
            }
          }
        ],
        event_source: 'web',
        event_source_id: 'test',
        partner_name: 'Segment'
      })
    })

    it('should send a successful lead_event event to reportWebEvent', async () => {
      const event = createTestEvent({
        timestamp: timestamp,
        event: 'lead_event',
        messageId: 'corey123',
        type: 'track',
        properties: {
          email: 'coreytest1231@gmail.com',
          phone: '+1555-555-5555',
          currency: 'USD',
          value: 100,
          query: 'shoes',
          price: 100,
          quantity: 2,
          category: 'Air Force One (Size S)',
          product_id: 'abc123',
          name: 'pname1',
          brand: 'Brand X'
        },
        context: {
          page: {
            url: 'http://demo.mywebsite.com?a=b&ttclid=123ATXSfe',
            referrer: 'https://google.com/'
          },
          userAgent:
            'Mozilla/5.0 (iPhone; CPU iPhone OS 12_1_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/16D57',
          ip: '0.0.0.0'
        },
        userId: 'testId123'
      })

      nock('https://business-api.tiktok.com/open_api/v1.3/event/track').post('/').reply(200, {})
      const responses = await testDestination.testAction('reportWebEvent', {
        event,
        settings,
        useDefaultMappings: true,
        mapping: {
          event: 'lead_event',
          contents: {
            '@arrayPath': [
              '$.properties',
              {
                price: {
                  '@path': '$.price'
                },
                quantity: {
                  '@path': '$.quantity'
                },
                content_category: {
                  '@path': '$.category'
                },
                content_id: {
                  '@path': '$.product_id'
                },
                content_name: {
                  '@path': '$.name'
                },
                brand: {
                  '@path': '$.brand'
                }
              }
            ]
          }
        }
      })

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(200)
      expect(responses[0].options.json).toMatchObject({
        data: [
          {
            event: 'lead_event',
            event_id: 'corey123',
            event_time: 1704721970,
            limited_data_use: false,
            page: {
              referrer: 'https://google.com/',
              url: 'http://demo.mywebsite.com?a=b&ttclid=123ATXSfe'
            },
            properties: {
              content_type: 'product',
              contents: [
                {
                  price: 100,
                  quantity: 2,
                  content_id: 'abc123',
                  content_category: 'Air Force One (Size S)',
                  content_name: 'pname1',
                  brand: 'Brand X'
                }
              ],
              currency: 'USD',
              query: 'shoes',
              value: 100
            },
            user: {
              email: ['eb9869a32b532840dd6aa714f7a872d21d6f650fc5aa933d9feefc64708969c7'],
              external_id: ['481f202262e9c5ccc48d24e60798fadaa5f6ff1f8369f7ab927c04c3aa682a7f'],
              ip: '0.0.0.0',
              phone: ['910a625c4ba147b544e6bd2f267e130ae14c591b6ba9c25cb8573322dedbebd0'],
              ttclid: '123ATXSfe',
              user_agent:
                'Mozilla/5.0 (iPhone; CPU iPhone OS 12_1_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/16D57'
            }
          }
        ],
        event_source: 'web',
        event_source_id: 'test',
        partner_name: 'Segment'
      })
    })

    it('should send test_event_code if present in mapping', async () => {
      const event = createTestEvent({
        timestamp: timestamp,
        event: 'Checkout Started',
        messageId: 'corey123',
        type: 'track',
        properties: {
          email: 'coreytest1231@gmail.com',
          phone: '+1555-555-5555',
          ttclid: '12345',
          currency: 'USD',
          value: 100,
          query: 'shoes',
          price: 100,
          quantity: 2,
          category: 'Air Force One (Size S)',
          product_id: 'abc123',
          name: 'pname1',
          brand: 'Brand X'
        },
        context: {
          page: {
            url: 'https://segment.com/',
            referrer: 'https://google.com/'
          },
          userAgent:
            'Mozilla/5.0 (iPhone; CPU iPhone OS 12_1_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/16D57',
          ip: '0.0.0.0'
        },
        userId: 'testId123'
      })

      const json = {
        event_source: 'web',
        event_source_id: 'test',
        partner_name: 'Segment',
        test_event_code: 'TEST04030',
        data: [
          {
            event: 'AddToCart',
            event_time: 1704721970,
            event_id: 'corey123',
            user: {
              external_id: ['481f202262e9c5ccc48d24e60798fadaa5f6ff1f8369f7ab927c04c3aa682a7f'],
              phone: ['910a625c4ba147b544e6bd2f267e130ae14c591b6ba9c25cb8573322dedbebd0'],
              email: ['eb9869a32b532840dd6aa714f7a872d21d6f650fc5aa933d9feefc64708969c7'],
              first_name: '',
              last_name: '',
              city: '',
              state: '',
              country: '',
              zip_code: '',
              ttclid: '12345',
              ip: '0.0.0.0',
              user_agent:
                'Mozilla/5.0 (iPhone; CPU iPhone OS 12_1_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/16D57'
            },
            properties: {
              contents: [
                {
                  price: 100,
                  quantity: 2,
                  content_category: 'Air Force One (Size S)',
                  content_id: 'abc123',
                  content_name: 'pname1',
                  brand: 'Brand X'
                }
              ],
              content_type: 'product',
              currency: 'USD',
              value: 100,
              query: 'shoes'
            },
            page: {
              url: 'https://segment.com/',
              referrer: 'https://google.com/'
            },
            limited_data_use: false
          }
        ]
      }

      nock('https://business-api.tiktok.com/open_api/v1.3/event/track').post('/', json).reply(200, {})
      const responses = await testDestination.testAction('reportWebEvent', {
        event,
        settings,
        useDefaultMappings: true,
        mapping: {
          event: 'AddToCart',
          test_event_code: 'TEST04030',
          contents: {
            '@arrayPath': [
              '$.properties',
              {
                price: {
                  '@path': '$.price'
                },
                quantity: {
                  '@path': '$.quantity'
                },
                content_category: {
                  '@path': '$.category'
                },
                content_id: {
                  '@path': '$.product_id'
                },
                content_name: {
                  '@path': '$.name'
                },
                brand: {
                  '@path': '$.brand'
                }
              }
            ]
          }
        }
      })

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(200)
    })

    it('should send a successful CRM event to reportWebEvent', async () => {
      const event = createTestEvent({
        timestamp: timestamp,
        event: 'Checkout Started',
        messageId: 'corey123',
        type: 'track',
        properties: {
          event_source: 'crm',
          lead_id: 'test_lead_id',
          lead_event_source: 'test_lead_event_source',
          email: 'coreytest1231@gmail.com',
          phone: '+1555-555-5555',
          ttclid: '12345',
          currency: 'USD',
          value: 100,
          query: 'shoes'
        },
        context: {
          page: {
            url: 'https://segment.com/',
            referrer: 'https://google.com/'
          },
          userAgent:
            'Mozilla/5.0 (iPhone; CPU iPhone OS 12_1_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/16D57',
          ip: '0.0.0.0'
        },
        userId: 'testId123'
      })

      const json = {
        event_source: 'crm',
        event_source_id: 'test',
        partner_name: 'Segment',
        data: [
          {
            event: 'InitiateCheckout',
            event_time: 1704721970,
            event_id: 'corey123',
            user: {
              external_id: ['481f202262e9c5ccc48d24e60798fadaa5f6ff1f8369f7ab927c04c3aa682a7f'],
              phone: ['910a625c4ba147b544e6bd2f267e130ae14c591b6ba9c25cb8573322dedbebd0'],
              email: ['eb9869a32b532840dd6aa714f7a872d21d6f650fc5aa933d9feefc64708969c7'],
              first_name: '',
              last_name: '',
              city: '',
              state: '',
              country: '',
              zip_code: '',
              ttclid: '12345',
              ip: '0.0.0.0',
              user_agent:
                'Mozilla/5.0 (iPhone; CPU iPhone OS 12_1_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/16D57'
            },
            properties: {
              contents: [],
              content_type: 'product',
              currency: 'USD',
              value: 100,
              query: 'shoes'
            },
            page: {
              url: 'https://segment.com/',
              referrer: 'https://google.com/'
            },
            lead: {
              lead_id: 'test_lead_id',
              lead_event_source: 'test_lead_event_source'
            },
            limited_data_use: false
          }
        ]
      }

      nock('https://business-api.tiktok.com/open_api/v1.3/event/track').post('/', json).reply(200, {})

      const responses = await testDestination.testAction('reportWebEvent', {
        event,
        settings,
        useDefaultMappings: true,
        mapping: {
          event: 'InitiateCheckout',
          event_source: 'crm'
        }
      })

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(200)
    })

    it('should send a successful web event with auto parameters to reportWebEvent', async () => {
      const event = createTestEvent({
        timestamp: timestamp,
        event: 'Checkout Started',
        messageId: 'corey123',
        type: 'track',
        properties: {
          email: 'coreytest1231@gmail.com',
          phone: '+1555-555-5555',
          ttclid: '12345',
          postal_code: 'test_postal_code',
          make: 'test_make',
          model: 'test_model',
          year: 2020,
          state_of_vehicle: 'New',
          mileage_value: 12345,
          mileage_unit: 'MI',
          exterior_color: 'test_exterior_color',
          transmission: 'Automatic',
          body_style: 'Coupe',
          fuel_type: 'Diesel',
          drivetrain: 'AWD',
          preferred_price_range_min: 1000,
          preferred_price_range_max: 2000,
          trim: 'test_trim',
          vin: 'test_vin',
          interior_color: 'test_interior_color',
          condition_of_vehicle: 'Good'
        },
        context: {
          page: {
            url: 'https://segment.com/',
            referrer: 'https://google.com/'
          },
          userAgent:
            'Mozilla/5.0 (iPhone; CPU iPhone OS 12_1_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/16D57',
          ip: '0.0.0.0'
        },
        userId: 'testId123'
      })

      const json = {
        event_source: 'web',
        event_source_id: 'test',
        partner_name: 'Segment',
        data: [
          {
            event: 'InitiateCheckout',
            event_time: 1704721970,
            event_id: 'corey123',
            user: {
              external_id: ['481f202262e9c5ccc48d24e60798fadaa5f6ff1f8369f7ab927c04c3aa682a7f'],
              phone: ['910a625c4ba147b544e6bd2f267e130ae14c591b6ba9c25cb8573322dedbebd0'],
              email: ['eb9869a32b532840dd6aa714f7a872d21d6f650fc5aa933d9feefc64708969c7'],
              first_name: '',
              last_name: '',
              city: '',
              state: '',
              country: '',
              zip_code: '',
              ttclid: '12345',
              ip: '0.0.0.0',
              user_agent:
                'Mozilla/5.0 (iPhone; CPU iPhone OS 12_1_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/16D57'
            },
            properties: {
              contents: [],
              content_type: 'product',
              postal_code: 'test_postal_code',
              make: 'test_make',
              model: 'test_model',
              year: 2020,
              state_of_vehicle: 'New',
              exterior_color: 'test_exterior_color',
              transmission: 'Automatic',
              body_style: 'Coupe',
              fuel_type: 'Diesel',
              trim: 'test_trim',
              vin: 'test_vin',
              interior_color: 'test_interior_color',
              condition_of_vehicle: 'Good',
              mileage: {
                unit: 'MI',
                value: 12345
              },
              preferred_price_range: [1000, 2000]
            },
            page: {
              url: 'https://segment.com/',
              referrer: 'https://google.com/'
            },
            limited_data_use: false
          }
        ]
      }

      nock('https://business-api.tiktok.com/open_api/v1.3/event/track').post('/', json).reply(200, {})

      const responses = await testDestination.testAction('reportWebEvent', {
        event,
        settings,
        useDefaultMappings: true,
        mapping: {
          event: 'InitiateCheckout',
          event_source: 'web',
          event_spec_type: VEHICLE_FIELDS
        }
      })

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(200)
    })

    it('should send a successful web event with travel parameters to reportWebEvent', async () => {
      const event = createTestEvent({
        timestamp: timestamp,
        event: 'Checkout Started',
        messageId: 'corey123',
        type: 'track',
        properties: {
          email: 'coreytest1231@gmail.com',
          phone: '+1555-555-5555',
          ttclid: '12345',
          city: 'test_city',
          region: 'test_region',
          country: 'test_country',
          checkin_date: 'test_checkin_date',
          checkout_date: 'test_checkout_date',
          num_adults: 1,
          num_children: 1,
          num_infants: 1,
          suggested_hotels: ['test_suggested_hotels_1', 'test_suggested_hotels_2'],
          departing_departure_date: '20250901',
          returning_departure_date: '20250901',
          origin_airport: 'test_origin_airport',
          destination_airport: 'test_destination_airport',
          destination_ids: ['destination_ids_1', 'destination_ids_2'],
          departing_arrival_date: '20250901',
          returning_arrival_date: '20250901',
          travel_class: 'eco',
          user_score: 1,
          preferred_num_stops: 0,
          travel_start: '20250901',
          travel_end: '20250901',
          suggested_destinations: ['suggested_destinations_1', 'suggested_destinations_2']
        },
        context: {
          page: {
            url: 'https://segment.com/',
            referrer: 'https://google.com/'
          },
          userAgent:
            'Mozilla/5.0 (iPhone; CPU iPhone OS 12_1_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/16D57',
          ip: '0.0.0.0'
        },
        userId: 'testId123'
      })

      const json = {
        event_source: 'web',
        event_source_id: 'test',
        partner_name: 'Segment',
        data: [
          {
            event: 'InitiateCheckout',
            event_time: 1704721970,
            event_id: 'corey123',
            user: {
              external_id: ['481f202262e9c5ccc48d24e60798fadaa5f6ff1f8369f7ab927c04c3aa682a7f'],
              phone: ['910a625c4ba147b544e6bd2f267e130ae14c591b6ba9c25cb8573322dedbebd0'],
              email: ['eb9869a32b532840dd6aa714f7a872d21d6f650fc5aa933d9feefc64708969c7'],
              first_name: '',
              last_name: '',
              city: '',
              state: '',
              country: '',
              zip_code: '',
              ttclid: '12345',
              ip: '0.0.0.0',
              user_agent:
                'Mozilla/5.0 (iPhone; CPU iPhone OS 12_1_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/16D57'
            },
            properties: {
              contents: [],
              content_type: 'product',
              city: 'test_city',
              region: 'test_region',
              country: 'test_country',
              checkin_date: 'test_checkin_date',
              checkout_date: 'test_checkout_date',
              num_adults: 1,
              num_children: 1,
              num_infants: 1,
              suggested_hotels: ['test_suggested_hotels_1', 'test_suggested_hotels_2'],
              departing_departure_date: '20250901',
              returning_departure_date: '20250901',
              origin_airport: 'test_origin_airport',
              destination_airport: 'test_destination_airport',
              destination_ids: ['destination_ids_1', 'destination_ids_2'],
              departing_arrival_date: '20250901',
              returning_arrival_date: '20250901',
              travel_class: 'eco',
              user_score: 1,
              preferred_num_stops: 0,
              travel_start: '20250901',
              travel_end: '20250901',
              suggested_destinations: ['suggested_destinations_1', 'suggested_destinations_2']
            },
            page: {
              url: 'https://segment.com/',
              referrer: 'https://google.com/'
            },
            limited_data_use: false
          }
        ]
      }

      nock('https://business-api.tiktok.com/open_api/v1.3/event/track').post('/', json).reply(200, {})

      const responses = await testDestination.testAction('reportWebEvent', {
        event,
        settings,
        useDefaultMappings: true,
        mapping: {
          event: 'InitiateCheckout',
          event_source: 'web',
          event_spec_type: TRAVEL_FIELDS
        }
      })

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(200)
    })
  })
})
