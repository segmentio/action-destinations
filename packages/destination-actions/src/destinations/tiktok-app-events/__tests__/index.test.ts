import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Definition from '../index'
import { Settings } from '../generated-types'
import { productProperties } from '../index'

let testDestination = createTestIntegration(Definition)
const timestamp = '2024-01-08T13:52:50.212Z'
const settings: Settings = {
  accessToken: 'test',
  appID: 'appIdTest'
}

describe('Tiktok App Events', () => {
  describe('reportAppEvent', () => {
    beforeEach(() => {
      jest.clearAllMocks()
      nock.cleanAll()
      testDestination = createTestIntegration(Definition)
    })

    it('should send a successful InitiateCheckout event to reportAppEvent', async () => {
      const event = createTestEvent({
        timestamp: timestamp,
        event: 'Checkout Started',
        messageId: 'corey123',
        type: 'track',
        properties: {
          currency:"USD",
          products: [
            {
              product_id: "prod id 1",
              price: 100,
              quantity: 2,
              category: "trains",
              name: "Choo-choo toy",
              brand: "TrainCo"
            }
          ],
          value: 100,
          email:"test@test.com",
          phone: ["+353987687687", "+2132435345"],
          campaign: {
            name: "camp name",
            ad_group: "camp ad group",
            ad_creative: "ad creative"
          },
          provider: "provider 1"
        },
        context: {
          device: {
            id: "B5372DB0-C21E-11E4-8DFC-AA07A5B093DB",
            advertisingId: "7A3CBEA0-BDF5-11E4-8DFC-AA07A5B093DB",
            adTrackingEnabled: true,
            type: "ios"
          },
          app: {
            name: "InitechGlobal",
            version: "545",
            namespace: "com.production.segment"
          },
          os: {
            name: "iPhone OS",
            version: "18.1.3"
          },
          locale: "en-US",
          userAgent:
            'Mozilla/5.0 (iPhone; CPU iPhone OS 12_1_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/16D57',
          ip: '0.0.0.0'
        },
        userId: 'testId123'
      })

      nock('https://business-api.tiktok.com/open_api/v1.3/event/track/').post('/').reply(200, {})
      const responses = await testDestination.testAction('reportAppEvent', {
        event,
        settings,
        useDefaultMappings: true,
        mapping: {
          event: 'Checkout',
          contents: {
            '@arrayPath': [
              '$.properties.products',
              {
                ...productProperties
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
            event: 'Checkout',
            event_id: 'corey123',
            event_time: 1704721970,
            limited_data_use: false,
            properties: {
              content_type: 'product',
              contents: [
                { 
                  content_id: "prod id 1",
                  price: 100,
                  quantity: 2,
                  content_category: "trains",
                  content_name: "Choo-choo toy",
                  brand: "TrainCo"
                }
              ],
              currency: 'USD',
              value: 100
            },
            user: {
              email: ['f660ab912ec121d1b1e928a0bb4bc61b15f5ad44d5efdc4e1c92a25e99b8e44a'],
              external_id: ['481f202262e9c5ccc48d24e60798fadaa5f6ff1f8369f7ab927c04c3aa682a7f'],
              ip: '0.0.0.0',
              phone: ['2dcdfdf2e17a1da67c29c18e7ad8e7d0db33f7bd060ca0b57283f7de039bc478', '0806656035ae6c32c59071bfeb47c81c1a2eb370e3fca994869e90af24f26073'],
              user_agent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 12_1_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/16D57',
              idfa: "7A3CBEA0-BDF5-11E4-8DFC-AA07A5B093DB",
              idfv: "B5372DB0-C21E-11E4-8DFC-AA07A5B093DB"
            }
          }
        ],
        event_source: 'app',
        event_source_id: 'appIdTest',
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
      const responses = await testDestination.testAction('reportAppEvent', {
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
      const responses = await testDestination.testAction('reportAppEvent', {
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

    it('should send a successful lead_event event to reportAppEvent', async () => {
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
      const responses = await testDestination.testAction('reportAppEvent', {
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
      const responses = await testDestination.testAction('reportAppEvent', {
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
  })
})
