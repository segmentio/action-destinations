import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../index'
import { API_VERSION } from '../constants'

const testDestination = createTestIntegration(Destination)
const settings = {
  pixelId: '123321',
  testEventCode: '',
  token: process.env.TOKEN
}
const settingsWithTestEventCode = {
  pixelId: '123321',
  testEventCode: '1234567890',
  token: process.env.TOKEN
}

describe('FacebookConversionsApi', () => {
  describe('AddToCart', () => {
    it('should handle a basic event', async () => {
      nock(`https://graph.facebook.com/v${API_VERSION}/${settings.pixelId}`).post(`/events`).reply(201, {})

      const event = createTestEvent({
        event: 'Product Added',
        userId: 'abc123',
        timestamp: '1631210000',
        properties: {
          action_source: 'email',
          currency: 'USD',
          value: 12.12,
          email: 'nicholas.aguilar@segment.com',
          traits: {
            city: 'Gotham',
            country: 'United States',
            last_name: 'Wayne'
          },
          partner_name: 'liveramp',
          partner_id: 'faf12efasdfasdf1edasdasdfadf='
        }
      })

      const responses = await testDestination.testAction('addToCart', {
        event,
        settings,
        mapping: {
          currency: {
            '@path': '$.properties.currency'
          },
          value: {
            '@path': '$.properties.value'
          },
          user_data: {
            email: {
              '@path': '$.properties.email'
            },
            partner_id: {
              '@path': '$.properties.partner_id'
            },
            partner_name: {
              '@path': '$.properties.partner_name'
            }
          },
          action_source: {
            '@path': '$.properties.action_source'
          },
          event_time: {
            '@path': '$.timestamp'
          },
          custom_data: {
            '@path': '$.properties.traits'
          }
        }
      })

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(201)

      expect(responses[0].options.body).toMatchInlineSnapshot(
        `"{\\"data\\":[{\\"event_name\\":\\"AddToCart\\",\\"event_time\\":\\"1631210000\\",\\"action_source\\":\\"email\\",\\"user_data\\":{\\"em\\":\\"eeaf810ee0e3cef3307089f22c3804f54c79eed19ef29bf70df864b43862c380\\",\\"partner_id\\":\\"faf12efasdfasdf1edasdasdfadf=\\",\\"partner_name\\":\\"liveramp\\"},\\"custom_data\\":{\\"city\\":\\"Gotham\\",\\"country\\":\\"United States\\",\\"last_name\\":\\"Wayne\\",\\"currency\\":\\"USD\\",\\"value\\":12.12}}]}"`
      )
    })

    it('should throw an error for invalid currency values', async () => {
      nock(`https://graph.facebook.com/v${API_VERSION}/${settings.pixelId}`).post(`/events`).reply(201, {})

      const event = createTestEvent({
        event: 'Product Added',
        userId: 'abc123',
        timestamp: '1631210010',
        properties: {
          action_source: 'email',
          currency: 'FAKE',
          value: 12.12,
          email: 'nicholas.aguilar@segment.com'
        }
      })

      await expect(
        testDestination.testAction('addToCart', {
          event,
          settings,
          mapping: {
            currency: {
              '@path': '$.properties.currency'
            },
            value: {
              '@path': '$.properties.value'
            },
            user_data: {
              email: {
                '@path': '$.properties.email'
              }
            },
            action_source: {
              '@path': '$.properties.action_source'
            },
            event_time: {
              '@path': '$.timestamp'
            }
          }
        })
      ).rejects.toThrowError('FAKE is not a valid currency code.')
    })

    it('should handle default mappings', async () => {
      nock(`https://graph.facebook.com/v${API_VERSION}/${settings.pixelId}`).post(`/events`).reply(201, {})

      const event = createTestEvent({
        event: 'Product Added',
        timestamp: '1631210020',
        messageId: 'test',
        properties: {
          userId: 'testuser1234',
          action_source: 'email',
          currency: 'USD',
          product_id: 'abc12345',
          quantity: 1,
          price: 100
        }
      })

      const responses = await testDestination.testAction('addToCart', {
        event,
        settings,
        useDefaultMappings: true,
        mapping: { action_source: { '@path': '$.properties.action_source' } }
      })

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(201)

      expect(responses[0].options.body).toMatchInlineSnapshot(
        `"{\\"data\\":[{\\"event_name\\":\\"AddToCart\\",\\"event_time\\":\\"1631210020\\",\\"event_source_url\\":\\"https://segment.com/academy/\\",\\"event_id\\":\\"test\\",\\"action_source\\":\\"email\\",\\"user_data\\":{\\"external_id\\":[\\"831c237928e6212bedaa4451a514ace3174562f6761f6a157a2fe5082b36e2fb\\"],\\"client_ip_address\\":\\"8.8.8.8\\",\\"client_user_agent\\":\\"Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B143 Safari/601.1\\"},\\"custom_data\\":{\\"currency\\":\\"USD\\",\\"value\\":100,\\"contents\\":[{\\"id\\":\\"abc12345\\",\\"quantity\\":1,\\"item_price\\":100}]}}]}"`
      )
    })

    it('should throw an error if no id parameter is included in contents array objects', async () => {
      nock(`https://graph.facebook.com/v${API_VERSION}/${settings.pixelId}`).post(`/events`).reply(201, {})

      const event = createTestEvent({
        event: 'Product Added',
        userId: 'abc123',
        timestamp: '1631210030',
        properties: {
          email: 'test@test.com',
          action_source: 'email',
          currency: 'USD',
          value: 12.12,
          quantity: 1204,
          delivery_category: 'drone'
        }
      })

      await expect(
        testDestination.testAction('addToCart', {
          event,
          settings,
          mapping: {
            currency: {
              '@path': '$.properties.currency'
            },
            value: {
              '@path': '$.properties.value'
            },
            action_source: {
              '@path': '$.properties.action_source'
            },
            event_time: {
              '@path': '$.timestamp'
            },
            contents: [
              {
                quantity: {
                  '@path': '$.properties.quantity'
                },
                delivery_category: {
                  '@path': '$.properties.delivery_category'
                }
              }
            ],
            user_data: {
              email: {
                '@path': '$.properties.email'
              }
            }
          }
        })
      ).rejects.toThrowError("contents[0] must include an 'id' parameter.")
    })

    it('should send data processing options', async () => {
      nock(`https://graph.facebook.com/v${API_VERSION}/${settings.pixelId}`).post(`/events`).reply(201, {})

      const event = createTestEvent({
        event: 'Product Added',
        timestamp: '1631210020',
        messageId: 'test',
        properties: {
          data_processing_options: true,
          data_processing_options_state: 1000,
          data_processing_options_country: 1,
          userId: 'testuser1234',
          action_source: 'email',
          currency: 'USD',
          product_id: 'abc12345',
          quantity: 1,
          price: 100
        }
      })

      const responses = await testDestination.testAction('addToCart', {
        event,
        settings,
        useDefaultMappings: true,
        mapping: {
          action_source: { '@path': '$.properties.action_source' },
          data_processing_options: {
            '@path': '$.properties.data_processing_options'
          },
          data_processing_options_state: {
            '@path': '$.properties.data_processing_options_state'
          },
          data_processing_options_country: {
            '@path': '$.properties.data_processing_options_country'
          }
        }
      })

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(201)

      expect(responses[0].options.body).toMatchInlineSnapshot(
        `"{\\"data\\":[{\\"event_name\\":\\"AddToCart\\",\\"event_time\\":\\"1631210020\\",\\"event_source_url\\":\\"https://segment.com/academy/\\",\\"event_id\\":\\"test\\",\\"action_source\\":\\"email\\",\\"user_data\\":{\\"external_id\\":[\\"831c237928e6212bedaa4451a514ace3174562f6761f6a157a2fe5082b36e2fb\\"],\\"client_ip_address\\":\\"8.8.8.8\\",\\"client_user_agent\\":\\"Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B143 Safari/601.1\\"},\\"custom_data\\":{\\"currency\\":\\"USD\\",\\"value\\":100,\\"contents\\":[{\\"id\\":\\"abc12345\\",\\"quantity\\":1,\\"item_price\\":100}]},\\"data_processing_options\\":[\\"LDU\\"],\\"data_processing_options_country\\":1,\\"data_processing_options_state\\":1000}]}"`
      )
    })

    it('should not send data processing options', async () => {
      nock(`https://graph.facebook.com/v${API_VERSION}/${settings.pixelId}`).post(`/events`).reply(201, {})

      const event = createTestEvent({
        event: 'Product Added',
        timestamp: '1631210020',
        messageId: 'test',
        properties: {
          userId: 'testuser1234',
          data_processing_options: false,
          action_source: 'email',
          currency: 'USD',
          product_id: 'abc12345',
          quantity: 1,
          price: 100
        }
      })

      const responses = await testDestination.testAction('addToCart', {
        event,
        settings,
        useDefaultMappings: true,
        mapping: {
          action_source: {
            '@path': '$.properties.action_source'
          },
          data_processing_options: {
            '@path': '$.properties.data_processing_options'
          }
        }
      })

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(201)

      expect(responses[0].options.body).toMatchInlineSnapshot(
        `"{\\"data\\":[{\\"event_name\\":\\"AddToCart\\",\\"event_time\\":\\"1631210020\\",\\"event_source_url\\":\\"https://segment.com/academy/\\",\\"event_id\\":\\"test\\",\\"action_source\\":\\"email\\",\\"user_data\\":{\\"external_id\\":[\\"831c237928e6212bedaa4451a514ace3174562f6761f6a157a2fe5082b36e2fb\\"],\\"client_ip_address\\":\\"8.8.8.8\\",\\"client_user_agent\\":\\"Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B143 Safari/601.1\\"},\\"custom_data\\":{\\"currency\\":\\"USD\\",\\"value\\":100,\\"contents\\":[{\\"id\\":\\"abc12345\\",\\"quantity\\":1,\\"item_price\\":100}]}}]}"`
      )
    })

    it('should send data processing options without state or country code set by user', async () => {
      nock(`https://graph.facebook.com/v${API_VERSION}/${settings.pixelId}`).post(`/events`).reply(201, {})

      const event = createTestEvent({
        event: 'Product Added',
        timestamp: '1631210020',
        messageId: 'test',
        properties: {
          data_processing_options: true,
          userId: 'testuser1234',
          action_source: 'email',
          currency: 'USD',
          product_id: 'abc12345',
          quantity: 1,
          price: 100
        }
      })

      const responses = await testDestination.testAction('addToCart', {
        event,
        settings,
        useDefaultMappings: true,
        mapping: {
          action_source: { '@path': '$.properties.action_source' },
          data_processing_options: {
            '@path': '$.properties.data_processing_options'
          }
        }
      })

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(201)

      expect(responses[0].options.body).toMatchInlineSnapshot(
        `"{\\"data\\":[{\\"event_name\\":\\"AddToCart\\",\\"event_time\\":\\"1631210020\\",\\"event_source_url\\":\\"https://segment.com/academy/\\",\\"event_id\\":\\"test\\",\\"action_source\\":\\"email\\",\\"user_data\\":{\\"external_id\\":[\\"831c237928e6212bedaa4451a514ace3174562f6761f6a157a2fe5082b36e2fb\\"],\\"client_ip_address\\":\\"8.8.8.8\\",\\"client_user_agent\\":\\"Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B143 Safari/601.1\\"},\\"custom_data\\":{\\"currency\\":\\"USD\\",\\"value\\":100,\\"contents\\":[{\\"id\\":\\"abc12345\\",\\"quantity\\":1,\\"item_price\\":100}]},\\"data_processing_options\\":[\\"LDU\\"],\\"data_processing_options_country\\":0,\\"data_processing_options_state\\":0}]}"`
      )
    })

    it('should throw an error if contents.delivery_category is not supported', async () => {
      nock(`https://graph.facebook.com/v${API_VERSION}/${settings.pixelId}`).post(`/events`).reply(201, {})

      const event = createTestEvent({
        event: 'Product Added',
        userId: 'abc123',
        timestamp: '1631210030',
        properties: {
          email: 'test@test.com',
          action_source: 'email',
          currency: 'USD',
          value: 12.12,
          id: 'abc123',
          quantity: 1204,
          delivery_category: 'submarine'
        }
      })

      await expect(
        testDestination.testAction('addToCart', {
          event,
          settings,
          mapping: {
            currency: {
              '@path': '$.properties.currency'
            },
            value: {
              '@path': '$.properties.value'
            },
            action_source: {
              '@path': '$.properties.action_source'
            },
            event_time: {
              '@path': '$.timestamp'
            },
            contents: [
              {
                id: {
                  '@path': '$.properties.id'
                },
                quantity: {
                  '@path': '$.properties.quantity'
                },
                delivery_category: {
                  '@path': '$.properties.delivery_category'
                }
              }
            ],
            user_data: {
              email: {
                '@path': '$.properties.email'
              }
            }
          }
        })
      ).rejects.toThrowError('contents[0].delivery_category must be one of {in_store, home_delivery, curbside}.')
    })

    it('should throw an error if no user_data keys are included', async () => {
      nock(`https://graph.facebook.com/v${API_VERSION}/${settings.pixelId}`).post(`/events`).reply(201, {})

      const event = createTestEvent({
        event: 'Product Added',
        userId: 'abc123',
        timestamp: '1631210030',
        properties: {
          action_source: 'email',
          currency: 'USD',
          value: 12.12
        }
      })

      await expect(
        testDestination.testAction('addToCart', {
          event,
          settings,
          mapping: {
            currency: {
              '@path': '$.properties.currency'
            },
            value: {
              '@path': '$.properties.value'
            },
            action_source: {
              '@path': '$.properties.action_source'
            },
            event_time: {
              '@path': '$.timestamp'
            }
            // No user data mapping included. This should cause action to fail.
          }
        })
      ).rejects.toThrowError("The root value is missing the required field 'user_data'.")
    })

    it('should send test_event_code if present in settings', async () => {
      nock(`https://graph.facebook.com/v${API_VERSION}/${settingsWithTestEventCode.pixelId}`)
        .post(`/events`)
        .reply(201, {})

      const event = createTestEvent({
        event: 'Product Added',
        userId: 'abc123',
        timestamp: '1631210000',
        properties: {
          action_source: 'email',
          currency: 'USD',
          value: 12.12,
          email: 'nicholas.aguilar@segment.com',
          traits: {
            city: 'Gotham',
            country: 'United States',
            last_name: 'Wayne'
          }
        }
      })

      const responses = await testDestination.testAction('addToCart', {
        event,
        settings: settingsWithTestEventCode,
        mapping: {
          currency: {
            '@path': '$.properties.currency'
          },
          value: {
            '@path': '$.properties.value'
          },
          user_data: {
            email: {
              '@path': '$.properties.email'
            }
          },
          action_source: {
            '@path': '$.properties.action_source'
          },
          event_time: {
            '@path': '$.timestamp'
          },
          custom_data: {
            '@path': '$.properties.traits'
          }
        }
      })

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(201)

      expect(responses[0].options.body).toMatchInlineSnapshot(
        `"{\\"data\\":[{\\"event_name\\":\\"AddToCart\\",\\"event_time\\":\\"1631210000\\",\\"action_source\\":\\"email\\",\\"user_data\\":{\\"em\\":\\"eeaf810ee0e3cef3307089f22c3804f54c79eed19ef29bf70df864b43862c380\\"},\\"custom_data\\":{\\"city\\":\\"Gotham\\",\\"country\\":\\"United States\\",\\"last_name\\":\\"Wayne\\",\\"currency\\":\\"USD\\",\\"value\\":12.12}}],\\"test_event_code\\":\\"1234567890\\"}"`
      )
    })

    it('should send app events using default mappings correctly', async () => {
      nock(`https://graph.facebook.com/v${API_VERSION}/${settings.pixelId}`).post(`/events`).reply(201, {})

      const event = createTestEvent({
        event: 'Product Added',
        userId: 'abc123',
        messageId: '123',
        timestamp: '1631210000',
        properties: {
          action_source: 'email',
          currency: 'USD',
          value: 12.12,
          email: 'nicholas.aguilar@segment.com',
          product_id: 'abc12345',
          traits: {
            city: 'Gotham',
            country: 'United States',
            last_name: 'Wayne'
          }
        },
        context: {
          app: {
            build: '2',
            name: 'Krusty Krab ToGo',
            namespace: 'com.krusty.krab.ios-prod',
            version: '2.0.1'
          },
          device: {
            id: '1234-5678',
            manufacturer: 'Apple',
            model: 'iPhone10,5',
            name: 'iPhone X',
            type: 'ios'
          },
          locale: 'en-US',
          timezone: 'America/Los Angeles',
          screen: {
            height: 736,
            width: 414
          },
          network: {
            carrier: 'AT&T',
            cellular: true,
            wifi: true
          },
          os: {
            name: 'iOS',
            version: '16.3.1'
          }
        }
      })

      const responses = await testDestination.testAction('addToCart', {
        event,
        settings,
        mapping: {
          action_source: { '@path': '$.properties.action_source' },
          app_data_field: {
            use_app_data: true,
            // The default mappings from the app_data object need to be recreated here
            // since 'use_app_data' is set to true. Otherwise, the default mappings
            // will not be set.
            application_tracking_enabled: {
              '@path': '$.context.device.adTrackingEnabled'
            },
            packageName: {
              '@path': '$.context.app.namespace'
            },
            longVersion: {
              '@path': '$.context.app.version'
            },
            osVersion: {
              '@path': '$.context.os.version'
            },
            deviceName: {
              '@path': '$.context.device.model'
            },
            locale: {
              '@path': '$.context.locale'
            },
            carrier: {
              '@path': '$.context.network.carrier'
            },
            width: {
              '@path': '$.context.screen.width'
            },
            height: {
              '@path': '$.context.screen.height'
            },
            density: {
              '@path': '$.context.screen.density'
            },
            deviceTimezone: {
              '@path': '$.context.timezone'
            }
          }
        },
        useDefaultMappings: true
      })

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(201)

      expect(responses[0].options.body).toMatchInlineSnapshot(
        `"{\\"data\\":[{\\"event_name\\":\\"AddToCart\\",\\"event_time\\":\\"1631210000\\",\\"event_id\\":\\"123\\",\\"action_source\\":\\"email\\",\\"user_data\\":{\\"external_id\\":[\\"6ca13d52ca70c883e0f0bb101e425a89e8624de51db2d2392593af6a84118090\\"]},\\"custom_data\\":{\\"currency\\":\\"USD\\",\\"contents\\":[{\\"id\\":\\"abc12345\\"}]},\\"app_data\\":{\\"advertiser_tracking_enabled\\":0,\\"application_tracking_enabled\\":0,\\"extinfo\\":[\\"\\",\\"com.krusty.krab.ios-prod\\",\\"\\",\\"2.0.1\\",\\"16.3.1\\",\\"iPhone10,5\\",\\"en-US\\",\\"\\",\\"AT&T\\",\\"414\\",\\"736\\",\\"\\",\\"\\",\\"\\",\\"\\",\\"America/Los Angeles\\"]}}]}"`
      )
    })

    it('should not send app events by default', async () => {
      nock(`https://graph.facebook.com/v${API_VERSION}/${settings.pixelId}`).post(`/events`).reply(201, {})

      const event = createTestEvent({
        event: 'Product Added',
        userId: 'abc123',
        messageId: '123',
        timestamp: '1631210000',
        properties: {
          action_source: 'email',
          currency: 'USD',
          value: 12.12,
          email: 'nicholas.aguilar@segment.com',
          product_id: 'abc12345',
          traits: {
            city: 'Gotham',
            country: 'United States',
            last_name: 'Wayne'
          }
        },
        context: {
          app: {
            build: '2',
            name: 'Krusty Krab ToGo',
            namespace: 'com.krusty.krab.ios-prod',
            version: '2.0.1'
          },
          device: {
            id: '1234-5678',
            manufacturer: 'Apple',
            model: 'iPhone10,5',
            name: 'iPhone X',
            type: 'ios'
          },
          locale: 'en-US',
          timezone: 'America/Los Angeles',
          screen: {
            height: 736,
            width: 414
          },
          network: {
            carrier: 'AT&T',
            cellular: true,
            wifi: true
          },
          os: {
            name: 'iOS',
            version: '16.3.1'
          }
        }
      })

      const responses = await testDestination.testAction('addToCart', {
        event,
        settings,
        mapping: {
          action_source: { '@path': '$.properties.action_source' }
        },
        useDefaultMappings: true
      })
      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(201)

      expect(responses[0].options.body).toMatchInlineSnapshot(
        `"{\\"data\\":[{\\"event_name\\":\\"AddToCart\\",\\"event_time\\":\\"1631210000\\",\\"event_id\\":\\"123\\",\\"action_source\\":\\"email\\",\\"user_data\\":{\\"external_id\\":[\\"6ca13d52ca70c883e0f0bb101e425a89e8624de51db2d2392593af6a84118090\\"]},\\"custom_data\\":{\\"currency\\":\\"USD\\",\\"contents\\":[{\\"id\\":\\"abc12345\\"}]}}]}"`
      )
    })

    it('should handle basic event with mutiple externalIds', async () => {
      nock(`https://graph.facebook.com/v${API_VERSION}/${settings.pixelId}`).post(`/events`).reply(201, {})

      const event = createTestEvent({
        event: 'Product Added',
        userId: 'abc123',
        timestamp: '1631210000',
        properties: {
          action_source: 'email',
          currency: 'USD',
          value: 12.12,
          email: 'nicholas.aguilar@segment.com',
          externalIds: ['abc123', 'xyz123'],
          traits: {
            city: 'Gotham',
            country: 'United States',
            last_name: 'Wayne'
          },
          partner_name: 'liveramp',
          partner_id: 'faf12efasdfasdf1edasdasdfadf='
        }
      })

      const responses = await testDestination.testAction('addToCart', {
        event,
        settings,
        mapping: {
          currency: {
            '@path': '$.properties.currency'
          },
          value: {
            '@path': '$.properties.value'
          },
          user_data: {
            externalId: {
              '@path': '$.properties.externalIds'
            },
            email: {
              '@path': '$.properties.email'
            },
            partner_id: {
              '@path': '$.properties.partner_id'
            },
            partner_name: {
              '@path': '$.properties.partner_name'
            }
          },
          action_source: {
            '@path': '$.properties.action_source'
          },
          event_time: {
            '@path': '$.timestamp'
          },
          custom_data: {
            '@path': '$.properties.traits'
          }
        }
      })

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(201)
      expect(responses[0].options.body).toMatchInlineSnapshot(
        `"{\\"data\\":[{\\"event_name\\":\\"AddToCart\\",\\"event_time\\":\\"1631210000\\",\\"action_source\\":\\"email\\",\\"user_data\\":{\\"em\\":\\"eeaf810ee0e3cef3307089f22c3804f54c79eed19ef29bf70df864b43862c380\\",\\"external_id\\":[\\"6ca13d52ca70c883e0f0bb101e425a89e8624de51db2d2392593af6a84118090\\",\\"f0a72890897acefdb2c6c8c06134339a73cc6205833ca38dba6f9fdc94b60596\\"],\\"partner_id\\":\\"faf12efasdfasdf1edasdasdfadf=\\",\\"partner_name\\":\\"liveramp\\"},\\"custom_data\\":{\\"city\\":\\"Gotham\\",\\"country\\":\\"United States\\",\\"last_name\\":\\"Wayne\\",\\"currency\\":\\"USD\\",\\"value\\":12.12}}]}"`
      )
    })
  })
})
