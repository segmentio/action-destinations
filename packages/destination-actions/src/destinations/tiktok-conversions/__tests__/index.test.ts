import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Definition from '../index'
import { Settings } from '../generated-types'

const testDestination = createTestIntegration(Definition)
const timestamp = '2024-01-08T13:52:50.212Z'
const settings: Settings = {
  accessToken: 'test',
  pixelCode: 'test'
}

describe('Tiktok Conversions', () => {
  describe('reportWebEvent', () => {
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
              description: undefined,
              order_id: undefined,
              query: 'shoes',
              shop_id: undefined,
              value: 100
            },
            test_event_code: undefined,
            user: {
              email: ['eb9869a32b532840dd6aa714f7a872d21d6f650fc5aa933d9feefc64708969c7'],
              external_id: ['481f202262e9c5ccc48d24e60798fadaa5f6ff1f8369f7ab927c04c3aa682a7f'],
              ip: '0.0.0.0',
              lead_id: undefined,
              locale: undefined,
              phone: ['910a625c4ba147b544e6bd2f267e130ae14c591b6ba9c25cb8573322dedbebd0'],
              ttclid: '12345',
              ttp: undefined,
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
              description: undefined,
              order_id: undefined,
              query: 'shoes',
              shop_id: undefined,
              value: 100
            },
            test_event_code: undefined,
            user: {
              email: ['eb9869a32b532840dd6aa714f7a872d21d6f650fc5aa933d9feefc64708969c7'],
              external_id: ['481f202262e9c5ccc48d24e60798fadaa5f6ff1f8369f7ab927c04c3aa682a7f'],
              ip: '0.0.0.0',
              lead_id: undefined,
              locale: undefined,
              phone: ['910a625c4ba147b544e6bd2f267e130ae14c591b6ba9c25cb8573322dedbebd0'],
              ttclid: '12345',
              ttp: undefined,
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
              description: undefined,
              order_id: undefined,
              query: 'shoes',
              shop_id: undefined,
              value: 100
            },
            test_event_code: undefined,
            user: {
              email: ['eb9869a32b532840dd6aa714f7a872d21d6f650fc5aa933d9feefc64708969c7'],
              external_id: ['481f202262e9c5ccc48d24e60798fadaa5f6ff1f8369f7ab927c04c3aa682a7f'],
              ip: '0.0.0.0',
              lead_id: undefined,
              locale: undefined,
              phone: ['910a625c4ba147b544e6bd2f267e130ae14c591b6ba9c25cb8573322dedbebd0'],
              ttclid: '12345',
              ttp: undefined,
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
              description: undefined,
              order_id: undefined,
              query: 'shoes',
              shop_id: undefined,
              value: 100
            },
            test_event_code: undefined,
            user: {
              email: ['eb9869a32b532840dd6aa714f7a872d21d6f650fc5aa933d9feefc64708969c7'],
              external_id: ['481f202262e9c5ccc48d24e60798fadaa5f6ff1f8369f7ab927c04c3aa682a7f'],
              ip: '0.0.0.0',
              lead_id: undefined,
              locale: undefined,
              phone: ['910a625c4ba147b544e6bd2f267e130ae14c591b6ba9c25cb8573322dedbebd0'],
              ttclid: '123ATXSfe',
              ttp: undefined,
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
          lead_id: '2229012621312',
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
              description: undefined,
              order_id: undefined,
              query: 'shoes',
              shop_id: undefined,
              value: 100
            },
            test_event_code: undefined,
            user: {
              email: ['eb9869a32b532840dd6aa714f7a872d21d6f650fc5aa933d9feefc64708969c7'],
              external_id: ['481f202262e9c5ccc48d24e60798fadaa5f6ff1f8369f7ab927c04c3aa682a7f'],
              ip: '0.0.0.0',
              lead_id: '2229012621312',
              locale: undefined,
              phone: ['910a625c4ba147b544e6bd2f267e130ae14c591b6ba9c25cb8573322dedbebd0'],
              ttclid: '123ATXSfe',
              ttp: undefined,
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

      nock('https://business-api.tiktok.com/open_api/v1.3/event/track').post('/').reply(200, {})
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
              description: undefined,
              order_id: undefined,
              query: 'shoes',
              shop_id: undefined,
              value: 100
            },
            test_event_code: 'TEST04030',
            user: {
              email: ['eb9869a32b532840dd6aa714f7a872d21d6f650fc5aa933d9feefc64708969c7'],
              external_id: ['481f202262e9c5ccc48d24e60798fadaa5f6ff1f8369f7ab927c04c3aa682a7f'],
              ip: '0.0.0.0',
              lead_id: undefined,
              locale: undefined,
              phone: ['910a625c4ba147b544e6bd2f267e130ae14c591b6ba9c25cb8573322dedbebd0'],
              ttclid: '12345',
              ttp: undefined,
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
  })
})
