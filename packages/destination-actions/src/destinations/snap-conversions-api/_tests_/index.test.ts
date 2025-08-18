import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Definition from '../index'
import { smartHash } from '../reportConversionEvent/utils'

const testDestination = createTestIntegration(Definition)

const testEvent = createTestEvent({
  timestamp: '2022-05-12T15:21:15.449Z',
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
  },
  integrations: {
    ['Snap Conversions Api']: {
      click_id: 'cliasdfck_id',
      uuid_c1: 'sadfjklsdf;lksjd'
    } as any
  }
})

type InputData<T extends typeof testDestination.testAction = typeof testDestination.testAction> = T extends (
  arg1: any,
  arg2: infer U,
  ...args: any[]
) => any
  ? U
  : never

const reportConversionEvent = async (inputData: InputData): Promise<{ url: string; data: any }> => {
  const event = createTestEvent(testEvent)
  const accessToken = 'access123'
  const refreshToken = 'refresh123'

  const responses = await testDestination.testAction('reportConversionEvent', {
    event,
    settings: {
      snap_app_id: 'test123',
      pixel_id: 'pixel123',
      app_id: '123'
    },
    useDefaultMappings: true,
    auth: {
      accessToken,
      refreshToken
    },
    ...inputData
  })

  return { url: responses[0].url, data: JSON.parse(responses[0].options.body as string).data[0] }
}

beforeEach(() => {
  nock.cleanAll() // Clear all Nock interceptors and filters
  nock(/.*/).post(/.*/).reply(200)
})

describe('Snap Conversions API ', () => {
  describe('ReportConversionEvent', () => {
    it('should use products array over number_items, product_id and category fields', async () => {
      const { data } = await reportConversionEvent({
        event: {
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
        },
        mapping: {
          event_type: 'PURCHASE',
          event_conversion_type: 'WEB'
        }
      })

      const { integration, event_name, event_time, user_data, custom_data, action_source, app_data } = data
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
      expect(num_items).toBe(10)
    })

    it('should handle a basic event', async () => {
      const { data } = await reportConversionEvent({
        mapping: {
          event_type: 'PURCHASE',
          event_conversion_type: 'WEB'
        }
      })

      const { integration, event_name, event_source_url, event_time, user_data, custom_data, action_source, app_data } =
        data
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
      await expect(
        reportConversionEvent({
          mapping: {
            event_type: 'PURCHASE',
            event_conversion_type: 'WEB'
          },
          settings: {
            snap_app_id: 'test123'
          }
        })
      ).rejects.toThrowError('If event conversion type is "WEB" then Pixel ID must be defined')
    })

    it('should fail app event without snap_app_id', async () => {
      await expect(
        reportConversionEvent({
          settings: {},
          mapping: {
            event_type: 'PURCHASE',
            event_conversion_type: 'MOBILE_APP'
          }
        })
      ).rejects.toThrowError('If event conversion type is "MOBILE_APP" then Snap App ID must be defined')
    })

    it('should handle an offline event conversion type', async () => {
      const { data } = await reportConversionEvent({
        mapping: {
          event_type: 'SAVE',
          event_conversion_type: 'OFFLINE'
        }
      })

      const { integration, event_name, event_source_url, event_time, user_data, custom_data, action_source, app_data } =
        data
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
      const { data } = await reportConversionEvent({
        mapping: {
          device_model: 'iPhone12,1',
          os_version: '17.2',
          event_type: 'SAVE',
          event_conversion_type: 'MOBILE_APP'
        }
      })

      const { integration, event_name, event_source_url, event_time, user_data, custom_data, action_source, app_data } =
        data
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
      expect(extinfo).toEqual([
        'i2',
        '',
        '',
        '',
        '17.2',
        'iPhone12,1',
        'en-US',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        'Europe/Amsterdam'
      ])
      expect(advertiser_tracking_enabled).toBe(0)
    })

    it('should fail invalid currency', async () => {
      await expect(
        reportConversionEvent({
          event: {
            ...testEvent,
            properties: {
              currency: 'Galleon'
            }
          },
          mapping: {
            event_type: 'PURCHASE',
            event_conversion_type: 'WEB'
          }
        })
      ).rejects.toThrowError('GALLEON is not a valid currency code.')
    })

    it('should fail missing event conversion type', async () => {
      await expect(
        reportConversionEvent({
          mapping: {
            event_type: 'PURCHASE'
          }
        })
      ).rejects.toThrowError("The root value is missing the required field 'action_source'.")
    })

    it('should handle a custom event', async () => {
      const { data } = await reportConversionEvent({
        event: {
          ...testEvent,
          event: 'CUSTOM_EVENT_5'
        },
        mapping: {
          event_type: { '@path': '$.event' },
          event_conversion_type: 'MOBILE_APP'
        }
      })

      const { integration, event_name, event_source_url, event_time, user_data, custom_data, action_source, app_data } =
        data
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
      await expect(
        reportConversionEvent({
          event: {
            ...testEvent,
            properties: {},
            context: {}
          },
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
      const { data } = await reportConversionEvent({
        event: {
          ...testEvent,
          properties: {
            email: 'test123@gmail.com'
          },
          context: {}
        },
        mapping: {
          event_type: 'PURCHASE',
          event_conversion_type: 'WEB'
        }
      })

      const { integration, event_name, event_time, user_data, action_source } = data
      const { em, ph } = user_data

      expect(integration).toBe('segment')
      expect(event_name).toBe('PURCHASE')
      expect(event_time).toBe(1652368875449)
      expect(em[0]).toBe('cc779c04191c2e736d89e45c11339c8382832bcaf70383f7df94e3d08ba7a6d9')
      expect(ph).toBeUndefined()
      expect(action_source).toBe('website')
    })

    it('should handle event with phone as only Snap identifier', async () => {
      const { data } = await reportConversionEvent({
        event: {
          ...testEvent,
          properties: {
            phone: '+44 844 412 4653'
          },
          context: {}
        },
        mapping: {
          event_type: 'PURCHASE',
          event_conversion_type: 'WEB'
        }
      })

      const { integration, event_name, event_time, user_data, action_source } = data
      const { ph } = user_data

      expect(integration).toBe('segment')
      expect(event_name).toBe('PURCHASE')
      expect(event_time).toBe(1652368875449)
      expect(ph[0]).toBe('dc008fda46e2e64002cf2f82a4906236282d431c4f75e5b60bfe79fc48546383')
      expect(action_source).toBe('website')
    })

    it('should handle event with advertising_id as only Snap identifier', async () => {
      const advertisingId = '87a7def4-b6e9-4bf7-91b6-66372842007a'

      const { data } = await reportConversionEvent({
        event: {
          ...testEvent,
          properties: {},
          context: {
            device: {
              advertisingId
            }
          }
        },
        mapping: {
          event_type: 'PURCHASE',
          event_conversion_type: 'WEB'
        }
      })

      const { integration, event_name, event_time, user_data, action_source } = data
      const { madid } = user_data

      expect(integration).toBe('segment')
      expect(event_name).toBe('PURCHASE')
      expect(event_time).toBe(1652368875449)
      expect(madid).toBe(advertisingId)
      expect(action_source).toBe('website')
    })

    it('should handle event with ip and user_agent as only Snap identifiers', async () => {
      const { data } = await reportConversionEvent({
        event: {
          ...testEvent,
          properties: {}
        },
        mapping: {
          event_type: 'PURCHASE',
          event_conversion_type: 'WEB'
        }
      })

      const { integration, event_name, event_time, user_data, action_source } = data
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

    it('should always use the pixel id in settings for web events', async () => {
      const { url } = await reportConversionEvent({
        event: {
          ...testEvent,
          properties: {}
        },
        mapping: {
          event_type: 'PURCHASE',
          event_conversion_type: 'WEB'
        }
      })

      expect(url).toBe('https://tr.snapchat.com/v3/pixel123/events?access_token=access123')
    })

    it('should trim a pixel id with leading or trailing whitespace', async () => {
      const { url } = await reportConversionEvent({
        event: {
          ...testEvent,
          properties: {}
        },
        settings: {
          pixel_id: '  pixel123  '
        },
        mapping: {
          event_type: 'PURCHASE',
          event_conversion_type: 'WEB'
        }
      })

      expect(url).toBe('https://tr.snapchat.com/v3/pixel123/events?access_token=access123')
    })

    it('should exclude number_items that is not a valid integer', async () => {
      const { url, data } = await reportConversionEvent({
        event: {
          ...testEvent,
          properties: {}
        },
        settings: {
          pixel_id: '  pixel123  '
        },
        auth: {
          accessToken: '    access123   ',
          refreshToken: ''
        },
        mapping: {
          event_type: 'PURCHASE',
          event_conversion_type: 'WEB',
          number_items: 'six'
        }
      })

      expect(url).toBe('https://tr.snapchat.com/v3/pixel123/events?access_token=access123')

      const { custom_data } = data

      expect(custom_data).toBeUndefined()
    })

    it('supports all the v3 fields', async () => {
      const {
        data: {
          action_source,
          app_data,
          custom_data,
          data_processing_options,
          data_processing_options_country,
          data_processing_options_state,
          event_id,
          event_name,
          event_source_url,
          event_time,
          user_data
        }
      } = await reportConversionEvent({
        event: {
          ...testEvent,
          properties: {
            currency: 'USD',
            email: '    Test123@gmail.com   ',
            phone: '+44 844 412 4653',
            birthday: '19970216',
            gender: 'Male',
            last_name: 'McTest',
            first_name: 'Tester',
            address: {
              city: 'A Fake City',
              state: 'Not Even A State',
              country: 'Bolivia',
              postalCode: '1234'
            },
            query: 'test-query',
            order_id: 'A1234',
            revenue: 1000
          },
          context: {
            ...testEvent.context,
            app: {
              namespace: 'com.segment.app',
              version: '1.0.0'
            },
            device: {
              adTrackingEnabled: true
            },
            screen: {
              width: '1920',
              height: '1080',
              density: '2.0'
            },
            os: {
              version: '19.5'
            }
          }
        },
        mapping: {
          event_name: 'PURCHASE',
          action_source: 'app',
          data_processing_options: true,
          data_processing_options_country: 1,
          data_processing_options_state: 1000
        }
      })

      expect(action_source).toEqual('app')
      expect(event_name).toEqual('PURCHASE')
      expect(event_id).toEqual(testEvent.messageId)
      expect(event_source_url).toEqual(testEvent.context?.page?.url ?? '')
      expect(event_time).toEqual(Date.parse(testEvent.timestamp as string))

      expect(data_processing_options).toEqual(['LDU'])
      expect(data_processing_options_country).toEqual(1)
      expect(data_processing_options_state).toEqual(1000)

      expect(app_data.application_tracking_enabled).toEqual(1)
      expect(app_data.extinfo).toEqual([
        'i2',
        'com.segment.app',
        '',
        '1.0.0',
        '19.5',
        '',
        'en-US',
        '',
        '',
        '1920',
        '1080',
        '2.0',
        '',
        '',
        '',
        'Europe/Amsterdam'
      ])

      expect(custom_data.currency).toEqual('USD')
      expect(custom_data.order_id).toEqual('A1234')
      expect(custom_data.search_string).toEqual('test-query')
      expect(custom_data.value).toEqual(1000)

      expect(user_data.external_id[0]).toEqual(smartHash(testEvent.userId ?? ''))
      expect(user_data.em[0]).toEqual(smartHash('test123@gmail.com'))
      expect(user_data.ph[0]).toEqual(smartHash('448444124653'))
      expect(user_data.db).toEqual(smartHash('19970216'))
      expect(user_data.fn).toEqual(smartHash('tester'))
      expect(user_data.ln).toEqual(smartHash('mctest'))
      expect(user_data.ge).toEqual(smartHash('m'))
      expect(user_data.ct).toEqual(smartHash('afakecity'))
      expect(user_data.st).toEqual(smartHash('notevenastate'))
      expect(user_data.country).toEqual(smartHash('bo'))
      expect(user_data.zp).toEqual(smartHash('1234'))
      expect(user_data.client_ip_address).toBe(testEvent.context?.ip)
      expect(user_data.client_user_agent).toBe(testEvent.context?.userAgent)
      expect(user_data.idfv).toBe(testEvent.context?.device?.id)
      expect(user_data.madid).toBe(testEvent.context?.device?.advertisingId)
      expect(user_data.sc_click_id).toEqual((testEvent.integrations?.['Snap Conversions Api'] as any)?.click_id)
      expect(user_data.sc_cookie1).toEqual((testEvent.integrations?.['Snap Conversions Api'] as any)?.uuid_c1)
    })

    it('should detect hashed values', async () => {
      const {
        data: {
          action_source,
          app_data,
          custom_data,
          data_processing_options,
          data_processing_options_country,
          data_processing_options_state,
          event_id,
          event_name,
          event_source_url,
          event_time,
          user_data
        }
      } = await reportConversionEvent({
        event: {
          ...testEvent,
          properties: {
            currency: 'USD',
            email: '388c735eec8225c4ad7a507944dd0a975296baea383198aa87177f29af2c6f69',
            phone: 'd74dcef7e1dba5aed01b62bc932ab1a7848ed9a590ca029aa958a1bf82b6993d',
            birthday: '6b86b273ff34fce19d6b804eff5a3f5747ada4eaa22f1d49c01e52ddb7875b4b',
            gender: 'eef2eae2699d81c58d176a9a58d4bf183df2acb6844b9eebf1cc60ae460ec50d',
            last_name: 'fd53ef835b15485572a6e82cf470dcb41fd218ae5751ab7531c956a2a6bcd3c7',
            first_name: '5f39b51ae9a4dacbb8d9538229d726bfb7e1a03633e37d64598c32989a8c1277',
            address: {
              city: 'dc968997b2904bcdb46f90378701f86fb09b17274579e9d75601cdaaecd0a5fb',
              state: 'dc968997b2904bcdb46f90378701f86fb09b17274579e9d75601cdaaecd0a5fb',
              country: 'dc968997b2904bcdb46f90378701f86fb09b17274579e9d75601cdaaecd0a5fb',
              postalCode: 'dc968997b2904bcdb46f90378701f86fb09b17274579e9d75601cdaaecd0a5fb'
            },
            query: 'test-query',
            order_id: 'A1234',
            revenue: 1000
          },
          context: {
            ...testEvent.context,
            app: {
              namespace: 'com.segment.app',
              version: '1.0.0'
            },
            device: {
              adTrackingEnabled: true
            },
            screen: {
              width: '1920',
              height: '1080',
              density: '2.0'
            },
            os: {
              version: '19.5'
            }
          }
        },
        mapping: {
          event_name: 'PURCHASE',
          action_source: 'app',
          data_processing_options: true,
          data_processing_options_country: 1,
          data_processing_options_state: 1000
        }
      })

      expect(action_source).toEqual('app')
      expect(event_name).toEqual('PURCHASE')
      expect(event_id).toEqual(testEvent.messageId)
      expect(event_source_url).toEqual(testEvent.context?.page?.url ?? '')
      expect(event_time).toEqual(Date.parse(testEvent.timestamp as string))

      expect(data_processing_options).toEqual(['LDU'])
      expect(data_processing_options_country).toEqual(1)
      expect(data_processing_options_state).toEqual(1000)

      expect(app_data.application_tracking_enabled).toEqual(1)
      expect(app_data.extinfo).toEqual([
        'i2',
        'com.segment.app',
        '',
        '1.0.0',
        '19.5',
        '',
        'en-US',
        '',
        '',
        '1920',
        '1080',
        '2.0',
        '',
        '',
        '',
        'Europe/Amsterdam'
      ])

      expect(custom_data.currency).toEqual('USD')
      expect(custom_data.order_id).toEqual('A1234')
      expect(custom_data.search_string).toEqual('test-query')
      expect(custom_data.value).toEqual(1000)

      expect(user_data.external_id[0]).toEqual(smartHash(testEvent.userId ?? ''))
      expect(user_data.em[0]).toEqual('388c735eec8225c4ad7a507944dd0a975296baea383198aa87177f29af2c6f69')
      expect(user_data.ph[0]).toEqual('d74dcef7e1dba5aed01b62bc932ab1a7848ed9a590ca029aa958a1bf82b6993d')
      expect(user_data.db).toEqual('6b86b273ff34fce19d6b804eff5a3f5747ada4eaa22f1d49c01e52ddb7875b4b')
      expect(user_data.fn).toEqual('5f39b51ae9a4dacbb8d9538229d726bfb7e1a03633e37d64598c32989a8c1277')
      expect(user_data.ln).toEqual('fd53ef835b15485572a6e82cf470dcb41fd218ae5751ab7531c956a2a6bcd3c7')
      expect(user_data.ge).toEqual('eef2eae2699d81c58d176a9a58d4bf183df2acb6844b9eebf1cc60ae460ec50d')
      expect(user_data.ct).toEqual('dc968997b2904bcdb46f90378701f86fb09b17274579e9d75601cdaaecd0a5fb')
      expect(user_data.st).toEqual('dc968997b2904bcdb46f90378701f86fb09b17274579e9d75601cdaaecd0a5fb')
      expect(user_data.country).toEqual('dc968997b2904bcdb46f90378701f86fb09b17274579e9d75601cdaaecd0a5fb')
      expect(user_data.zp).toEqual('dc968997b2904bcdb46f90378701f86fb09b17274579e9d75601cdaaecd0a5fb')
      expect(user_data.client_ip_address).toBe(testEvent.context?.ip)
      expect(user_data.client_user_agent).toBe(testEvent.context?.userAgent)
      expect(user_data.idfv).toBe(testEvent.context?.device?.id)
      expect(user_data.madid).toBe(testEvent.context?.device?.advertisingId)
      expect(user_data.sc_click_id).toEqual((testEvent.integrations?.['Snap Conversions Api'] as any)?.click_id)
      expect(user_data.sc_cookie1).toEqual((testEvent.integrations?.['Snap Conversions Api'] as any)?.uuid_c1)
    })

    it('should not add empty values in final payload', async () => {
      const {
        data: {
          action_source,
          app_data,
          custom_data,
          data_processing_options,
          data_processing_options_country,
          data_processing_options_state,
          event_id,
          event_name,
          event_source_url,
          event_time,
          user_data
        }
      } = await reportConversionEvent({
        event: {
          ...testEvent,
          properties: {
            currency: 'USD',
            email: '388c735eec8225c4ad7a507944dd0a975296baea383198aa87177f29af2c6f69',
            phone: 'd74dcef7e1dba5aed01b62bc932ab1a7848ed9a590ca029aa958a1bf82b6993d',
            query: 'test-query',
            order_id: 'A1234',
            revenue: 1000
          },
          context: {
            ...testEvent.context,
            app: {
              namespace: 'com.segment.app',
              version: '1.0.0'
            },
            device: {
              adTrackingEnabled: true
            },
            screen: {
              width: '1920',
              height: '1080',
              density: '2.0'
            },
            os: {
              version: '19.5'
            }
          }
        },
        mapping: {
          event_name: 'PURCHASE',
          action_source: 'app',
          data_processing_options: true,
          data_processing_options_country: 1,
          data_processing_options_state: 1000
        }
      })

      expect(action_source).toEqual('app')
      expect(event_name).toEqual('PURCHASE')
      expect(event_id).toEqual(testEvent.messageId)
      expect(event_source_url).toEqual(testEvent.context?.page?.url ?? '')
      expect(event_time).toEqual(Date.parse(testEvent.timestamp as string))

      expect(data_processing_options).toEqual(['LDU'])
      expect(data_processing_options_country).toEqual(1)
      expect(data_processing_options_state).toEqual(1000)

      expect(app_data.application_tracking_enabled).toEqual(1)
      expect(app_data.extinfo).toEqual([
        'i2',
        'com.segment.app',
        '',
        '1.0.0',
        '19.5',
        '',
        'en-US',
        '',
        '',
        '1920',
        '1080',
        '2.0',
        '',
        '',
        '',
        'Europe/Amsterdam'
      ])

      expect(custom_data.currency).toEqual('USD')
      expect(custom_data.order_id).toEqual('A1234')
      expect(custom_data.search_string).toEqual('test-query')
      expect(custom_data.value).toEqual(1000)

      expect(user_data.external_id[0]).toEqual(smartHash(testEvent.userId ?? ''))
      expect(user_data.em[0]).toEqual('388c735eec8225c4ad7a507944dd0a975296baea383198aa87177f29af2c6f69')
      expect(user_data.ph[0]).toEqual('d74dcef7e1dba5aed01b62bc932ab1a7848ed9a590ca029aa958a1bf82b6993d')
      expect(user_data.fn).toEqual(undefined)
      expect(user_data.ln).toEqual(undefined)
      expect(user_data.ge).toEqual(undefined)
      expect(user_data.db).toEqual(undefined)
      expect(user_data.ct).toEqual(undefined)
      expect(user_data.st).toEqual(undefined)
      expect(user_data.country).toEqual(undefined)
      expect(user_data.zp).toEqual(undefined)
      expect(user_data.client_ip_address).toBe(testEvent.context?.ip)
      expect(user_data.client_user_agent).toBe(testEvent.context?.userAgent)
      expect(user_data.idfv).toBe(testEvent.context?.device?.id)
      expect(user_data.madid).toBe(testEvent.context?.device?.advertisingId)
      expect(user_data.sc_click_id).toEqual((testEvent.integrations?.['Snap Conversions Api'] as any)?.click_id)
      expect(user_data.sc_cookie1).toEqual((testEvent.integrations?.['Snap Conversions Api'] as any)?.uuid_c1)
    })
  })
})
