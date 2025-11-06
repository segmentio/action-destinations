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

    it('should send a successful multi product event to reportAppEvent', async () => {
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
            },
            {
              product_id: "prod id 2",
              price: 99,
              quantity: 1,
              category: "cars",
              name: "vroom toy",
              brand: "CarCo"
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
                },
                { 
                  content_id: "prod id 2",
                  price: 99,
                  quantity: 1,
                  content_category: "cars",
                  content_name: "vroom toy",
                  brand: "CarCo"
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

    it('should send a successful single product event to reportAppEvent', async () => {
      const event = createTestEvent({
        timestamp: timestamp,
        event: 'Product Added',
        messageId: 'corey123',
        type: 'track',
        properties: {
          currency:"USD",
          product_id: "prod id 1",
          price: 100,
          quantity: 2,
          category: "trains",
          name: "Choo-choo toy",
          brand: "TrainCo",
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
          event: 'AddToCart',
          contents: {
            '@arrayPath': [
              '$.properties',
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
            event: 'AddToCart',
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

    it('IDFA should lower cased if already hashed', async () => {
      const event = createTestEvent({
        timestamp: timestamp,
        event: 'Product Added',
        messageId: 'corey123',
        type: 'track',
        properties: {
          currency:"USD",
          product_id: "prod id 1",
          price: 100,
          quantity: 2,
          category: "trains",
          name: "Choo-choo toy",
          brand: "TrainCo",
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
            advertisingId: "f660ab912ec121d1b1e928a0bb4bc61b15f5ad44d5efdc4e1c92a25e99b8e44a", // this is an already hashed IDFA
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
          event: 'AddToCart',
          contents: {
            '@arrayPath': [
              '$.properties',
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
            event: 'AddToCart',
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
              idfa: "f660ab912ec121d1b1e928a0bb4bc61b15f5ad44d5efdc4e1c92a25e99b8e44a",
              idfv: "B5372DB0-C21E-11E4-8DFC-AA07A5B093DB"
            }
          }
        ],
        event_source: 'app',
        event_source_id: 'appIdTest',
        partner_name: 'Segment'
      })
    })

    it('should throw an error if any product is missing a product id / content id', async () => {
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
            },
            {
              // product_id: "prod id 2", // oops no product id
              price: 99,
              quantity: 1,
              category: "cars",
              name: "vroom toy",
              brand: "CarCo"
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

      await expect(
        testDestination.testAction('reportAppEvent', {
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
      ).rejects.toThrowError(new Error('content_id is required for event Checkout'))
    })



  })
})
