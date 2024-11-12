import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import ga4 from '../index'

const testDestination = createTestIntegration(ga4)
const apiSecret = 'b287432uhkjHIUEL'

describe('GA4', () => {
  describe('View Promotion', () => {
    it('should handle basic mapping overrides', async () => {
      nock('https://gtmadapter-node-cbjg5cz5hq-ew.a.run.app', {
        reqheaders: {
          token: apiSecret
        }
      })
        .post('/v2/consolidated-data')
        .reply(201, {})
      const event = createTestEvent({
        event: 'Promotion Viewed',
        userId: '3456fff',
        timestamp: '2022-06-22T22:20:58.905Z',
        anonymousId: 'anon-567890',
        type: 'track',
        properties: {
          promotion_id: 'promo_1',
          creative: 'top_banner_2',
          name: '75% store-wide shoe sale',
          position: 'home_banner_top',
          products: [
            {
              product_id: '507f1f77bcf86cd799439011',
              sku: '45790-32',
              name: 'Monopoly: 3rd Edition',
              price: 19,
              quantity: 1,
              category: 'Games',
              promotion: 'SUPER SUMMER SALE; 3% off',
              slot: '2',
              promo_id: '12345',
              creative_name: 'Sale'
            }
          ]
        }
      })
      const responses = await testDestination.testAction('viewPromotion', {
        event,
        settings: {
          apiSecret
        },
        mapping: {
          clientId: {
            '@path': '$.anonymousId'
          },
          timestamp_micros: {
            '@path': '$.timestamp'
          },
          engagement_time_msec: 2,
          location_id: {
            '@path': '$.properties.promotion_id'
          },
          items: [
            {
              item_name: {
                '@path': `$.properties.products.0.name`
              },
              item_id: {
                '@path': `$.properties.products.0.product_id`
              },
              promotion_name: {
                '@path': `$.properties.products.0.promotion`
              },
              creative_slot: {
                '@path': `$.properties.products.0.slot`
              },
              promotion_id: {
                '@path': `$.properties.products.0.promo_id`
              },
              creative_name: {
                '@path': `$.properties.products.0.creative_name`
              }
            }
          ]
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
            "token": Array [
              "b287432uhkjHIUEL",
            ],
            "user-agent": Array [
              "Segment (Actions)",
            ],
          },
        }
      `)

      expect(responses[0].options.body).toMatchInlineSnapshot(
        `"{\\"client_id\\":\\"3456fff\\",\\"events\\":[{\\"name\\":\\"view_promotion\\",\\"params\\":{\\"creative_slot\\":\\"top_banner_2\\",\\"location_id\\":\\"promo_1\\",\\"promotion_id\\":\\"promo_1\\",\\"promotion_name\\":\\"75% store-wide shoe sale\\",\\"items\\":[{\\"item_name\\":\\"Monopoly: 3rd Edition\\",\\"item_id\\":\\"507f1f77bcf86cd799439011\\",\\"promotion_name\\":\\"SUPER SUMMER SALE; 3% off\\",\\"creative_slot\\":\\"2\\",\\"promotion_id\\":\\"12345\\",\\"creative_name\\":\\"Sale\\"}],\\"engagement_time_msec\\":2}}],\\"timestamp_micros\\":1655936458905000}"`
      )
    })

    it('should allow currency value to be lowercase', async () => {
      nock('https://gtmadapter-node-cbjg5cz5hq-ew.a.run.app', {
        reqheaders: {
          token: apiSecret
        }
      })
        .post('/v2/consolidated-data')
        .reply(201, {})
      const event = createTestEvent({
        event: 'Promotion Viewed',
        userId: '3456fff',
        timestamp: '2022-06-22T22:20:58.905Z',
        anonymousId: 'anon-567890',
        type: 'track',
        properties: {
          promotion_id: 'promo_1',
          creative: 'top_banner_2',
          name: '75% store-wide shoe sale',
          position: 'home_banner_top',
          products: [
            {
              product_id: '507f1f77bcf86cd799439011',
              sku: '45790-32',
              name: 'Monopoly: 3rd Edition',
              price: 19,
              quantity: 1,
              category: 'Games',
              promotion: 'SUPER SUMMER SALE; 3% off',
              slot: '2',
              promo_id: '12345',
              creative_name: 'Sale',
              currency: 'usd'
            }
          ]
        }
      })
      const responses = await testDestination.testAction('viewPromotion', {
        event,
        settings: {
          apiSecret
        },
        mapping: {
          clientId: {
            '@path': '$.anonymousId'
          },
          engagement_time_msec: 2,
          location_id: {
            '@path': '$.properties.promotion_id'
          },
          items: [
            {
              item_name: {
                '@path': `$.properties.products.0.name`
              },
              item_id: {
                '@path': `$.properties.products.0.product_id`
              },
              promotion_name: {
                '@path': `$.properties.products.0.promotion`
              },
              creative_slot: {
                '@path': `$.properties.products.0.slot`
              },
              promotion_id: {
                '@path': `$.properties.products.0.promo_id`
              },
              creative_name: {
                '@path': `$.properties.products.0.creative_name`
              },
              currency: {
                '@path': `$.properties.products.0.currency`
              }
            }
          ]
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
            "token": Array [
              "b287432uhkjHIUEL",
            ],
            "user-agent": Array [
              "Segment (Actions)",
            ],
          },
        }
      `)

      expect(responses[0].options.body).toMatchInlineSnapshot(
        `"{\\"client_id\\":\\"3456fff\\",\\"events\\":[{\\"name\\":\\"view_promotion\\",\\"params\\":{\\"creative_slot\\":\\"top_banner_2\\",\\"location_id\\":\\"promo_1\\",\\"promotion_id\\":\\"promo_1\\",\\"promotion_name\\":\\"75% store-wide shoe sale\\",\\"items\\":[{\\"item_name\\":\\"Monopoly: 3rd Edition\\",\\"item_id\\":\\"507f1f77bcf86cd799439011\\",\\"promotion_name\\":\\"SUPER SUMMER SALE; 3% off\\",\\"creative_slot\\":\\"2\\",\\"promotion_id\\":\\"12345\\",\\"creative_name\\":\\"Sale\\",\\"currency\\":\\"usd\\"}],\\"engagement_time_msec\\":2}}],\\"timestamp_micros\\":1655936458905000}"`
      )
    })

    it('should throw an error for invalid currency values', async () => {
      nock('https://gtmadapter-node-cbjg5cz5hq-ew.a.run.app', {
        reqheaders: {
          token: apiSecret
        }
      })
        .post('/v2/consolidated-data')
        .reply(201, {})
      const event = createTestEvent({
        event: 'Checkout Started',
        userId: '3456fff',
        type: 'track',
        properties: {
          order_id: '5678dd9087-78',
          coupon: 'SUMMER_FEST',
          products: [
            {
              product_id: '12345',
              name: 'Monopoly',
              currency: '1234'
            }
          ]
        }
      })
      try {
        await testDestination.testAction('viewPromotion', {
          event,
          settings: {
            apiSecret
          },
          mapping: {
            client_id: {
              '@path': '$.userId'
            },
            coupon: {
              '@path': '$.properties.coupon'
            },
            items: [
              {
                item_name: {
                  '@path': `$.properties.products.0.name`
                },
                item_id: {
                  '@path': `$.properties.products.0.product_id`
                },
                currency: {
                  '@path': `$.properties.products.0.currency`
                }
              }
            ]
          },
          useDefaultMappings: true
        })
        fail('the test should have thrown an error')
      } catch (e) {
        expect(e.message).toBe('1234 is not a valid currency code.')
      }
    })

    it('should throw an error for products missing name and id', async () => {
      nock('https://gtmadapter-node-cbjg5cz5hq-ew.a.run.app', {
        reqheaders: {
          token: apiSecret
        }
      })
        .post('/v2/consolidated-data')
        .reply(201, {})
      const event = createTestEvent({
        event: 'Checkout Started',
        userId: '3456fff',
        type: 'track',
        properties: {
          order_id: '5678dd9087-78',
          coupon: 'SUMMER_FEST',
          currency: 'USD',
          products: [
            {
              quantity: 2,
              coupon: 'MOUNTAIN',
              brand: 'Canvas',
              category: 'T-Shirt',
              variant: 'Black',
              price: 19.98
            }
          ]
        }
      })
      try {
        await testDestination.testAction('viewPromotion', {
          event,
          settings: {
            apiSecret
          },
          mapping: {
            client_id: {
              '@path': '$.anonymousId'
            },
            currency: {
              '@path': '$.properties.currency'
            },
            value: {
              '@path': '$.properties.value'
            },
            items: [
              {
                item_brand: {
                  '@path': `$.properties.brand`
                }
              }
            ]
          },
          useDefaultMappings: true
        })
        fail('the test should have thrown an error')
      } catch (e) {
        expect(e.message).toBe('One of item id or item name is required.')
      }
    })

    it('should throw an error if there is no products array', async () => {
      nock('https://gtmadapter-node-cbjg5cz5hq-ew.a.run.app', {
        reqheaders: {
          token: apiSecret
        }
      })
        .post('/v2/consolidated-data')
        .reply(201, {})
      const event = createTestEvent({
        event: 'Promotion Viewed',
        userId: '3456fff',
        anonymousId: 'anon-567890',
        type: 'track',
        properties: {
          promotion_id: 'promo_3',
          creative: 'top_banner_2',
          name: '75% store-wide shoe sale',
          position: 'home_banner_top'
        }
      })
      try {
        await testDestination.testAction('viewPromotion', {
          event,
          settings: {
            apiSecret
          },
          mapping: {
            client_id: {
              '@path': '$.anonymousId'
            },
            promotion_id: {
              '@path': '$.properties.promotion_id'
            }
          },
          useDefaultMappings: false
        })
        fail('the test should have thrown an error')
      } catch (e) {
        expect(e.message).toBe("The root value is missing the required field 'items'.")
      }
    })

    it('should append user_properties correctly', async () => {
      nock('https://gtmadapter-node-cbjg5cz5hq-ew.a.run.app', {
        reqheaders: {
          token: apiSecret
        }
      })
        .post('/v2/consolidated-data')
        .reply(201, {})
      const event = createTestEvent({
        event: 'Promotion Viewed',
        userId: '3456fff',
        timestamp: '2022-06-22T22:20:58.905Z',
        anonymousId: 'anon-567890',
        type: 'track',
        properties: {
          promotion_id: 'promo_1',
          creative: 'top_banner_2',
          name: '75% store-wide shoe sale',
          position: 'home_banner_top',
          products: [
            {
              product_id: '507f1f77bcf86cd799439011',
              sku: '45790-32',
              name: 'Monopoly: 3rd Edition',
              price: 19,
              quantity: 1,
              category: 'Games',
              promotion: 'SUPER SUMMER SALE; 3% off',
              slot: '2',
              promo_id: '12345',
              creative_name: 'Sale'
            }
          ]
        }
      })

      const responses = await testDestination.testAction('viewPromotion', {
        event,
        settings: {
          apiSecret
        },
        mapping: {
          user_properties: {
            hello: 'world',
            a: '1',
            b: '2',
            c: '3'
          },
          clientId: {
            '@path': '$.anonymousId'
          },
          location_id: {
            '@path': '$.properties.promotion_id'
          },
          items: [
            {
              item_name: {
                '@path': `$.properties.products.0.name`
              },
              item_id: {
                '@path': `$.properties.products.0.product_id`
              },
              promotion_name: {
                '@path': `$.properties.products.0.promotion`
              },
              creative_slot: {
                '@path': `$.properties.products.0.slot`
              },
              promotion_id: {
                '@path': `$.properties.products.0.promo_id`
              },
              creative_name: {
                '@path': `$.properties.products.0.creative_name`
              }
            }
          ]
        },
        useDefaultMappings: true
      })

      expect(responses[0].options.body).toMatchInlineSnapshot(
        `"{\\"client_id\\":\\"3456fff\\",\\"events\\":[{\\"name\\":\\"view_promotion\\",\\"params\\":{\\"creative_slot\\":\\"top_banner_2\\",\\"location_id\\":\\"promo_1\\",\\"promotion_id\\":\\"promo_1\\",\\"promotion_name\\":\\"75% store-wide shoe sale\\",\\"items\\":[{\\"item_name\\":\\"Monopoly: 3rd Edition\\",\\"item_id\\":\\"507f1f77bcf86cd799439011\\",\\"promotion_name\\":\\"SUPER SUMMER SALE; 3% off\\",\\"creative_slot\\":\\"2\\",\\"promotion_id\\":\\"12345\\",\\"creative_name\\":\\"Sale\\"}],\\"engagement_time_msec\\":1}}],\\"user_properties\\":{\\"hello\\":{\\"value\\":\\"world\\"},\\"a\\":{\\"value\\":\\"1\\"},\\"b\\":{\\"value\\":\\"2\\"},\\"c\\":{\\"value\\":\\"3\\"}},\\"timestamp_micros\\":1655936458905000}"`
      )
    })

    it('should throw an error when params value is null', async () => {
      nock('https://gtmadapter-node-cbjg5cz5hq-ew.a.run.app', {
        reqheaders: {
          token: apiSecret
        }
      })
        .post('/v2/consolidated-data')
        .reply(201, {})
      const event = createTestEvent({
        event: 'Promotion Viewed',
        userId: '3456fff',
        anonymousId: 'anon-567890',
        type: 'track',
        properties: {
          promotion_id: 'promo_1',
          creative: 'top_banner_2',
          name: '75% store-wide shoe sale',
          position: 'home_banner_top',
          products: [
            {
              product_id: '507f1f77bcf86cd799439011',
              sku: '45790-32',
              name: 'Monopoly: 3rd Edition',
              price: 19,
              quantity: 1,
              category: 'Games',
              promotion: 'SUPER SUMMER SALE; 3% off',
              slot: '2',
              promo_id: '12345',
              creative_name: 'Sale'
            }
          ]
        }
      })

      try {
        await testDestination.testAction('viewPromotion', {
          event,
          settings: {
            apiSecret
          },
          mapping: {
            params: {
              test_value: null
            },
            clientId: {
              '@path': '$.anonymousId'
            },
            location_id: {
              '@path': '$.properties.promotion_id'
            },
            items: [
              {
                item_name: {
                  '@path': `$.properties.products.0.name`
                },
                item_id: {
                  '@path': `$.properties.products.0.product_id`
                },
                promotion_name: {
                  '@path': `$.properties.products.0.promotion`
                },
                creative_slot: {
                  '@path': `$.properties.products.0.slot`
                },
                promotion_id: {
                  '@path': `$.properties.products.0.promo_id`
                },
                creative_name: {
                  '@path': `$.properties.products.0.creative_name`
                }
              }
            ]
          },
          useDefaultMappings: true
        })
        fail('the test should have thrown an error')
      } catch (e) {
        expect(e.message).toBe(
          'Param [test_value] has unsupported value of type [NULL]. GA4 does not accept null, array, or object values for event parameters and item parameters.'
        )
      }
    })

    it('should throw an error when user_properties value is array', async () => {
      nock('https://gtmadapter-node-cbjg5cz5hq-ew.a.run.app', {
        reqheaders: {
          token: apiSecret
        }
      })
        .post('/v2/consolidated-data')
        .reply(201, {})
      const event = createTestEvent({
        event: 'Promotion Viewed',
        userId: '3456fff',
        anonymousId: 'anon-567890',
        type: 'track',
        properties: {
          promotion_id: 'promo_1',
          creative: 'top_banner_2',
          name: '75% store-wide shoe sale',
          position: 'home_banner_top',
          products: [
            {
              product_id: '507f1f77bcf86cd799439011',
              sku: '45790-32',
              name: 'Monopoly: 3rd Edition',
              price: 19,
              quantity: 1,
              category: 'Games',
              promotion: 'SUPER SUMMER SALE; 3% off',
              slot: '2',
              promo_id: '12345',
              creative_name: 'Sale'
            }
          ]
        }
      })

      try {
        await testDestination.testAction('viewPromotion', {
          event,
          settings: {
            apiSecret
          },
          mapping: {
            user_properties: {
              hello: ['World', 'world'],
              a: '1',
              b: '2',
              c: '3'
            },
            clientId: {
              '@path': '$.anonymousId'
            },
            location_id: {
              '@path': '$.properties.promotion_id'
            },
            items: [
              {
                item_name: {
                  '@path': `$.properties.products.0.name`
                },
                item_id: {
                  '@path': `$.properties.products.0.product_id`
                },
                promotion_name: {
                  '@path': `$.properties.products.0.promotion`
                },
                creative_slot: {
                  '@path': `$.properties.products.0.slot`
                },
                promotion_id: {
                  '@path': `$.properties.products.0.promo_id`
                },
                creative_name: {
                  '@path': `$.properties.products.0.creative_name`
                }
              }
            ]
          },
          useDefaultMappings: true
        })
        fail('the test should have thrown an error')
      } catch (e) {
        expect(e.message).toBe(
          'Param [hello] has unsupported value of type [Array]. GA4 does not accept array or object values for user properties.'
        )
      }
    })
  })
})
