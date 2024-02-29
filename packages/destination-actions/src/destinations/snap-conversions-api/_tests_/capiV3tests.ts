import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Definition from '../index'
import { Settings } from '../generated-types'

const testDestination = createTestIntegration(Definition)
const timestamp = '2022-05-12T15:21:15.449Z'
const settings: Settings = {
  snap_app_id: 'test123',
  pixel_id: 'test123',
  app_id: 'test123'
}
const accessToken = 'test123'
const refreshToken = 'test123'

const testEvent = createTestEvent({
  timestamp: timestamp,
  messageId: 'test-message-rv4t40s898k',
  event: 'PURCHASE',
  type: 'track',
  properties: {
    email: '   Test123@gmail.com    ',
    phone: '+44 844 412 4653',
    event_tag: 'back-to-school',
    number_items: 10,
    revenue: '15',
    currency: 'USD',
    level: 3
  }
})

const features = {
  ['actions-snap-api-migration-test-capiv3']: false,
  ['actions-snap-api-migration-use-capiv3']: true
}

export const capiV3tests = () =>
  describe('CAPIv3 Implementation', () => {
    it('should use products array over number_items, product_id and category fields', async () => {
      nock(/.*/).post(/.*/).reply(200)

      const event = createTestEvent({
        ...testEvent,
        properties: {
          email: 'test123@gmail.com',
          phone: '+44 844 412 4653',
          event_tag: 'back-to-school',
          quantity: 10,
          revenue: '15',
          currency: 'USD',
          level: 3,
          products: [
            { product_id: '123', category: 'games', brand: 'Hasbro' },
            { product_id: '456', category: 'games', brand: 'Mattel' }
          ]
        },
        context: {}
      })

      const responses = await testDestination.testAction('reportConversionEvent', {
        event,
        settings,
        useDefaultMappings: true,
        auth: {
          accessToken,
          refreshToken
        },
        features,
        mapping: {
          event_type: 'PURCHASE',
          event_conversion_type: 'WEB'
        }
      })

      expect(responses).not.toBeNull()
      expect(responses[0].status).toBe(200)

      const body = JSON.parse(responses[0].options.body as string)
      const { data } = body
      expect(data.length).toBe(1)

      const { integration, event_name, event_time, user_data, custom_data, action_source, app_data } = data[0]
      const { em, ph } = user_data
      const { brands, content_category, content_ids, currency, num_items, value } = custom_data

      expect(integration).toBe('segment')
      expect(event_name).toBe('PURCHASE')
      expect(event_time).toBe(1652368875449)

      expect(em[0]).toBe('cc779c04191c2e736d89e45c11339c8382832bcaf70383f7df94e3d08ba7a6d9')
      expect(ph[0]).toBe('dc008fda46e2e64002cf2f82a4906236282d431c4f75e5b60bfe79fc48546383')
      expect(currency).toBe('USD')
      expect(value).toBe(15)
      expect(action_source).toBe('website')
      // app_data is only defined when action_source is app
      expect(app_data).toBeUndefined()

      expect(brands).toEqual(['Hasbro', 'Mattel'])
      expect(content_category).toEqual(['games', 'games'])
      expect(content_ids).toEqual(['123', '456'])
      expect(num_items).toBe(2)
    })

    it('should handle a basic event', async () => {
      nock(/.*/).post(/.*/).reply(200)

      const event = createTestEvent(testEvent)

      const responses = await testDestination.testAction('reportConversionEvent', {
        event,
        settings,
        useDefaultMappings: true,
        auth: {
          accessToken,
          refreshToken
        },
        features,
        mapping: {
          event_type: 'PURCHASE',
          event_conversion_type: 'WEB'
        }
      })

      expect(responses).not.toBeNull()
      expect(responses[0].status).toBe(200)

      const body = JSON.parse(responses[0].options.body as string)

      const { data } = body
      expect(data.length).toBe(1)

      const { integration, event_name, event_source_url, event_time, user_data, custom_data, action_source, app_data } =
        data[0]
      const { client_ip_address, client_user_agent, em, ph } = user_data
      const { currency, value } = custom_data

      expect(integration).toBe('segment')
      expect(event_name).toBe('PURCHASE')
      expect(event_source_url).toBe('https://segment.com/academy/')
      expect(event_time).toBe(1652368875449)
      expect(client_ip_address).toBe('8.8.8.8')
      expect(client_user_agent).toBe(
        'Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B143 Safari/601.1'
      )
      expect(em[0]).toBe('cc779c04191c2e736d89e45c11339c8382832bcaf70383f7df94e3d08ba7a6d9')
      expect(ph[0]).toBe('dc008fda46e2e64002cf2f82a4906236282d431c4f75e5b60bfe79fc48546383')
      expect(currency).toBe('USD')
      expect(value).toBe(15)
      expect(action_source).toBe('website')
      // app_data is only defined when action_source is app
      expect(app_data).toBeUndefined()
    })

    it('should fail web event without pixel_id', async () => {
      nock(/.*/).post(/.*/).reply(200)

      const event = createTestEvent(testEvent)

      await expect(
        testDestination.testAction('reportConversionEvent', {
          event,
          settings: {
            snap_app_id: 'test123'
          },
          useDefaultMappings: true,
          auth: {
            accessToken,
            refreshToken
          },
          features,
          mapping: {
            event_type: 'PURCHASE',
            event_conversion_type: 'WEB'
          }
        })
      ).rejects.toThrowError('If event conversion type is "WEB" then Pixel ID must be defined')
    })

    it('should fail app event without snap_app_id', async () => {
      nock(/.*/).post(/.*/).reply(200)

      const event = createTestEvent(testEvent)

      await expect(
        testDestination.testAction('reportConversionEvent', {
          event,
          settings: {
            pixel_id: 'test123',
            app_id: 'test123'
          },
          useDefaultMappings: true,
          auth: {
            accessToken,
            refreshToken
          },
          features,
          mapping: {
            event_type: 'PURCHASE',
            event_conversion_type: 'MOBILE_APP'
          }
        })
      ).rejects.toThrowError('If event conversion type is "MOBILE_APP" then Snap App ID and App ID must be defined')
    })

    it('should handle an offline event conversion type', async () => {
      nock(/.*/).post(/.*/).reply(200)

      const event = createTestEvent(testEvent)

      const responses = await testDestination.testAction('reportConversionEvent', {
        event,
        settings,
        useDefaultMappings: true,
        auth: {
          accessToken,
          refreshToken
        },
        features,
        mapping: {
          event_type: 'SAVE',
          event_conversion_type: 'OFFLINE'
        }
      })

      expect(responses).not.toBeNull()
      expect(responses[0].status).toBe(200)

      const body = JSON.parse(responses[0].options.body as string)

      const { data } = body
      expect(data.length).toBe(1)

      const { integration, event_name, event_source_url, event_time, user_data, custom_data, action_source, app_data } =
        data[0]
      const { client_ip_address, client_user_agent, em, ph } = user_data
      const { currency, value } = custom_data

      expect(integration).toBe('segment')
      expect(event_name).toBe('SAVE')
      expect(event_source_url).toBe('https://segment.com/academy/')
      expect(event_time).toBe(1652368875449)
      expect(client_ip_address).toBe('8.8.8.8')
      expect(client_user_agent).toBe(
        'Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B143 Safari/601.1'
      )
      expect(em[0]).toBe('cc779c04191c2e736d89e45c11339c8382832bcaf70383f7df94e3d08ba7a6d9')
      expect(ph[0]).toBe('dc008fda46e2e64002cf2f82a4906236282d431c4f75e5b60bfe79fc48546383')
      expect(currency).toBe('USD')
      expect(value).toBe(15)
      expect(action_source).toBe('OFFLINE')

      // App data is only defined for app events
      expect(app_data).toBeUndefined()
    })

    it('should handle a mobile app event conversion type', async () => {
      nock(/.*/).post(/.*/).reply(200)

      const event = createTestEvent(testEvent)

      const responses = await testDestination.testAction('reportConversionEvent', {
        event,
        settings: {
          snap_app_id: '123',
          app_id: '123'
        },
        useDefaultMappings: true,
        auth: {
          accessToken,
          refreshToken
        },
        features,
        mapping: {
          device_model: 'iPhone12,1',
          os_version: '17.2',
          event_type: 'SAVE',
          event_conversion_type: 'MOBILE_APP'
        }
      })

      expect(responses[0].status).toBe(200)

      const body = JSON.parse(responses[0].options.body as string)

      const { data } = body
      expect(data.length).toBe(1)

      const { integration, event_name, event_source_url, event_time, user_data, custom_data, action_source, app_data } =
        data[0]
      const { client_ip_address, client_user_agent, em, ph } = user_data
      const { currency, value } = custom_data
      const { extinfo, advertiser_tracking_enabled } = app_data

      expect(integration).toBe('segment')
      expect(event_name).toBe('SAVE')
      expect(event_source_url).toBe('https://segment.com/academy/')
      expect(event_time).toBe(1652368875449)
      expect(client_ip_address).toBe('8.8.8.8')
      expect(client_user_agent).toBe(
        'Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B143 Safari/601.1'
      )
      expect(em[0]).toBe('cc779c04191c2e736d89e45c11339c8382832bcaf70383f7df94e3d08ba7a6d9')
      expect(ph[0]).toBe('dc008fda46e2e64002cf2f82a4906236282d431c4f75e5b60bfe79fc48546383')
      expect(currency).toBe('USD')
      expect(value).toBe(15)
      expect(action_source).toBe('app')
      expect(extinfo).toEqual(['i2', '', '', '', '17.2', 'iPhone12,1', '', '', '', '', '', '', '', '', '', ''])
      expect(advertiser_tracking_enabled).toBe(0)
    })

    it('should fail invalid currency', async () => {
      nock(/.*/).post(/.*/).reply(200)

      const event = createTestEvent({
        ...testEvent,
        properties: {
          currency: 'Galleon'
        }
      })

      await expect(
        testDestination.testAction('reportConversionEvent', {
          event,
          settings,
          useDefaultMappings: true,
          auth: {
            accessToken,
            refreshToken
          },
          features,
          mapping: {
            event_type: 'PURCHASE',
            event_conversion_type: 'WEB'
          }
        })
      ).rejects.toThrowError('Galleon is not a valid currency code.')
    })

    it('should fail missing event conversion type', async () => {
      nock(/.*/).post(/.*/).reply(200)

      const event = createTestEvent(testEvent)

      await expect(
        testDestination.testAction('reportConversionEvent', {
          event,
          settings,
          useDefaultMappings: true,
          auth: {
            accessToken,
            refreshToken
          },
          features,
          mapping: {
            event_type: 'PURCHASE'
          }
        })
      ).rejects.toThrowError("The root value is missing the required field 'event_conversion_type'.")
    })

    it('should handle a custom event', async () => {
      nock(/.*/).post(/.*/).reply(200)

      const event = createTestEvent({
        ...testEvent,
        event: 'CUSTOM_EVENT_5'
      })

      const responses = await testDestination.testAction('reportConversionEvent', {
        event,
        settings: {
          snap_app_id: '123',
          app_id: '123'
        },
        useDefaultMappings: true,
        auth: {
          accessToken,
          refreshToken
        },
        features,
        mapping: {
          event_type: { '@path': '$.event' },
          event_conversion_type: 'MOBILE_APP'
        }
      })

      expect(responses).not.toBeNull()
      expect(responses[0].status).toBe(200)

      const body = JSON.parse(responses[0].options.body as string)

      const { data } = body
      expect(data.length).toBe(1)

      const { integration, event_name, event_source_url, event_time, user_data, custom_data, action_source, app_data } =
        data[0]
      const { client_ip_address, client_user_agent, em, ph } = user_data
      const { currency, value } = custom_data
      const { app_id, advertiser_tracking_enabled } = app_data

      expect(integration).toBe('segment')
      expect(event_name).toBe('CUSTOM_EVENT_5')
      expect(event_source_url).toBe('https://segment.com/academy/')
      expect(event_time).toBe(1652368875449)
      expect(client_ip_address).toBe('8.8.8.8')
      expect(client_user_agent).toBe(
        'Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B143 Safari/601.1'
      )
      expect(em[0]).toBe('cc779c04191c2e736d89e45c11339c8382832bcaf70383f7df94e3d08ba7a6d9')
      expect(ph[0]).toBe('dc008fda46e2e64002cf2f82a4906236282d431c4f75e5b60bfe79fc48546383')
      expect(currency).toBe('USD')
      expect(value).toBe(15)
      expect(action_source).toBe('app')
      expect(app_id).toBe('123')
      expect(advertiser_tracking_enabled).toBe(0)
    })

    it('should fail event missing all Snap identifiers', async () => {
      const event = createTestEvent({
        ...testEvent,
        properties: {},
        context: {}
      })

      await expect(
        testDestination.testAction('reportConversionEvent', {
          event,
          settings,
          useDefaultMappings: true,
          auth: {
            accessToken,
            refreshToken
          },
          features,
          mapping: {
            event_type: 'PURCHASE',
            event_conversion_type: 'WEB'
          }
        })
      ).rejects.toThrowError(
        'Payload must contain values for Email or Phone Number or Mobile Ad Identifier or both IP Address and User Agent fields'
      )
    })

    it('should handle event with email as only Snap identifier', async () => {
      nock(/.*/).post(/.*/).reply(200)
      const event = createTestEvent({
        ...testEvent,
        properties: {
          email: 'test123@gmail.com'
        },
        context: {}
      })

      const responses = await testDestination.testAction('reportConversionEvent', {
        event,
        settings,
        useDefaultMappings: true,
        auth: {
          accessToken,
          refreshToken
        },
        features,
        mapping: {
          event_type: 'PURCHASE',
          event_conversion_type: 'WEB'
        }
      })

      expect(responses).not.toBeNull()
      expect(responses[0].status).toBe(200)

      const body = JSON.parse(responses[0].options.body as string)

      const { data } = body
      expect(data.length).toBe(1)

      const { integration, event_name, event_time, user_data, action_source } = data[0]
      const { em, ph } = user_data

      expect(integration).toBe('segment')
      expect(event_name).toBe('PURCHASE')
      expect(event_time).toBe(1652368875449)
      expect(em[0]).toBe('cc779c04191c2e736d89e45c11339c8382832bcaf70383f7df94e3d08ba7a6d9')
      expect(ph).toBeUndefined()
      expect(action_source).toBe('website')
    })

    it('should handle event with phone as only Snap identifier', async () => {
      nock(/.*/).post(/.*/).reply(200)
      const event = createTestEvent({
        ...testEvent,
        properties: {
          phone: '+44 844 412 4653'
        },
        context: {}
      })

      const responses = await testDestination.testAction('reportConversionEvent', {
        event,
        settings,
        useDefaultMappings: true,
        auth: {
          accessToken,
          refreshToken
        },
        features,
        mapping: {
          event_type: 'PURCHASE',
          event_conversion_type: 'WEB'
        }
      })

      const body = JSON.parse(responses[0].options.body as string)

      const { data } = body
      expect(data.length).toBe(1)

      const { integration, event_name, event_time, user_data, action_source } = data[0]
      const { ph } = user_data

      expect(integration).toBe('segment')
      expect(event_name).toBe('PURCHASE')
      expect(event_time).toBe(1652368875449)
      expect(ph[0]).toBe('dc008fda46e2e64002cf2f82a4906236282d431c4f75e5b60bfe79fc48546383')
      expect(action_source).toBe('website')
    })

    it('should handle event with advertising_id as only Snap identifier', async () => {
      nock(/.*/).post(/.*/).reply(200)
      const advertisingId = '87a7def4-b6e9-4bf7-91b6-66372842007a'
      const event = createTestEvent({
        ...testEvent,
        properties: {},
        context: {
          device: {
            advertisingId
          }
        }
      })

      const responses = await testDestination.testAction('reportConversionEvent', {
        event,
        settings,
        useDefaultMappings: true,
        auth: {
          accessToken,
          refreshToken
        },
        features,
        mapping: {
          event_type: 'PURCHASE',
          event_conversion_type: 'WEB'
        }
      })

      const body = JSON.parse(responses[0].options.body as string)

      const { data } = body
      expect(data.length).toBe(1)

      const { integration, event_name, event_time, user_data, action_source } = data[0]
      const { madid } = user_data

      expect(integration).toBe('segment')
      expect(event_name).toBe('PURCHASE')
      expect(event_time).toBe(1652368875449)
      expect(madid).toBe(advertisingId)
      expect(action_source).toBe('website')
    })

    it('should handle event with ip and user_agent as only Snap identifiers', async () => {
      nock(/.*/).post(/.*/).reply(200)
      const event = createTestEvent({
        ...testEvent,
        properties: {}
      })

      const responses = await testDestination.testAction('reportConversionEvent', {
        event,
        settings,
        useDefaultMappings: true,
        auth: {
          accessToken,
          refreshToken
        },
        features,
        mapping: {
          event_type: 'PURCHASE',
          event_conversion_type: 'WEB'
        }
      })

      const body = JSON.parse(responses[0].options.body as string)

      const { data } = body
      expect(data.length).toBe(1)

      const { integration, event_name, event_time, user_data, action_source } = data[0]
      const { client_ip_address, client_user_agent } = user_data

      expect(integration).toBe('segment')
      expect(event_name).toBe('PURCHASE')
      expect(event_time).toBe(1652368875449)
      expect(client_ip_address).toBe('8.8.8.8')
      expect(client_user_agent).toBe(
        'Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B143 Safari/601.1'
      )
      expect(action_source).toBe('website')
    })
  })
