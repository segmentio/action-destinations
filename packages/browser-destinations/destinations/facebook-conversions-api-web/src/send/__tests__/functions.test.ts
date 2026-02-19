import { send } from '../functions'

describe('Facebook Conversions API Web - Send Functions', () => {
  let mockFbq
  let mockAnalytics
  let mockClientParamBuilder
  let consoleWarnSpy

  beforeEach(() => {
    mockFbq = jest.fn()
    mockAnalytics = {
      storage: {
        get: jest.fn(),
        set: jest.fn()
      }
    }

    mockClientParamBuilder = undefined
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  const defaultSettings = {
    pixelId: 'test-pixel-123',
    ldu: 'Disabled'
  }

  describe('send - Standard Events', () => {
    it('should send Purchase event with required fields', async () => {
      const payload = {
        event_config: {
          event_name: 'Purchase',
          show_fields: false
        },
        content_ids: ['product-123'],
        value: 99.99,
        currency: 'USD'
      }

      await send(mockFbq, mockClientParamBuilder, payload, defaultSettings, mockAnalytics)

      expect(mockFbq).toHaveBeenCalledWith(
        'trackSingle',
        'test-pixel-123',
        'Purchase',
        {
          partner_agent: 'segment',
          content_ids: ['product-123'],
          value: 99.99,
          currency: 'USD'
        },
        undefined
      )
    })

    it('should send AddToCart event with contents', async () => {
      const payload = {
        event_config: {
          event_name: 'AddToCart',
          show_fields: false
        },
        contents: [
          {
            id: 'product-123',
            quantity: 2,
            item_price: 49.99
          }
        ],
        value: 99.98,
        currency: 'USD'
      }

      await send(mockFbq, mockClientParamBuilder, payload, defaultSettings, mockAnalytics)

      expect(mockFbq).toHaveBeenCalledWith(
        'trackSingle',
        'test-pixel-123',
        'AddToCart',
        {
          partner_agent: 'segment',
          contents: [{ id: 'product-123', quantity: 2, item_price: 49.99 }],
          value: 99.98,
          currency: 'USD'
        },
        undefined
      )
    })

    it('should send ViewContent event', async () => {
      const payload = {
        event_config: {
          event_name: 'ViewContent',
          show_fields: false
        },
        content_ids: ['product-456'],
        content_name: 'Test Product',
        content_category: 'Electronics',
        value: 199.99
      }

      await send(mockFbq, mockClientParamBuilder, payload, defaultSettings, mockAnalytics)

      expect(mockFbq).toHaveBeenCalledWith(
        'trackSingle',
        'test-pixel-123',
        'ViewContent',
        {
          partner_agent: 'segment',
          content_ids: ['product-456'],
          content_name: 'Test Product',
          content_category: 'Electronics',
          value: 199.99
        },
        undefined
      )
    })

    it('should send PageView event', async () => {
      const payload = {
        event_config: {
          event_name: 'PageView',
          show_fields: false
        }
      }

      await send(mockFbq, mockClientParamBuilder, payload, defaultSettings, mockAnalytics)

      expect(mockFbq).toHaveBeenCalledWith('trackSingle', 'test-pixel-123', 'PageView', { partner_agent: 'segment' }, undefined)
    })
  })

  describe('send - Custom Events', () => {
    it('should send custom event with custom event name', async () => {
      const payload = {
        event_config: {
          event_name: 'CustomEvent',
          custom_event_name: 'MyCustomEvent',
          show_fields: true
        },
        value: 50.0,
        custom_data: {
          custom_field_1: 'value1',
          custom_field_2: 'value2'
        }
      }

      await send(mockFbq, mockClientParamBuilder, payload, defaultSettings, mockAnalytics)

      expect(mockFbq).toHaveBeenCalledWith(
        'trackSingleCustom',
        'test-pixel-123',
        'MyCustomEvent',
        {
          partner_agent: 'segment',
          value: 50.0,
          custom_data: {
            custom_field_1: 'value1',
            custom_field_2: 'value2'
          }
        },
        undefined
      )
    })
  })

  describe('send - Validation', () => {
    it('should warn if AddToCart is missing both content_ids and contents', async () => {
      const payload = {
        event_config: {
          event_name: 'AddToCart',
          show_fields: false
        },
        value: 99.99
      }

      await send(mockFbq, mockClientParamBuilder, payload, defaultSettings, mockAnalytics)

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('At least one of content_ids or contents is required for the AddToCart event')
      )
      expect(mockFbq).not.toHaveBeenCalled()
    })

    it('should warn if Purchase is missing both content_ids and contents', async () => {
      const payload = {
        event_config: {
          event_name: 'Purchase',
          show_fields: false
        },
        value: 199.99,
        currency: 'USD'
      }

      await send(mockFbq, mockClientParamBuilder, payload, defaultSettings, mockAnalytics)

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('At least one of content_ids or contents is required for the Purchase event')
      )
      expect(mockFbq).not.toHaveBeenCalled()
    })

    it('should warn if ViewContent is missing both content_ids and contents', async () => {
      const payload = {
        event_config: {
          event_name: 'ViewContent',
          show_fields: false
        }
      }

      await send(mockFbq, mockClientParamBuilder, payload, defaultSettings, mockAnalytics)

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('At least one of content_ids or contents is required for the ViewContent event')
      )
      expect(mockFbq).not.toHaveBeenCalled()
    })

    it('should not warn if AddToCart has content_ids', async () => {
      const payload = {
        event_config: {
          event_name: 'AddToCart',
          show_fields: false
        },
        content_ids: ['product-123'],
        value: 99.99
      }

      await send(mockFbq, mockClientParamBuilder, payload, defaultSettings, mockAnalytics)

      expect(consoleWarnSpy).not.toHaveBeenCalled()
      expect(mockFbq).toHaveBeenCalled()
    })

    it('should not warn if AddToCart has contents', async () => {
      const payload = {
        event_config: {
          event_name: 'AddToCart',
          show_fields: false
        },
        contents: [{ id: 'product-123', quantity: 1 }],
        value: 99.99
      }

      await send(mockFbq, mockClientParamBuilder, payload, defaultSettings, mockAnalytics)

      expect(consoleWarnSpy).not.toHaveBeenCalled()
      expect(mockFbq).toHaveBeenCalled()
    })
  })

  describe('send - Event Options', () => {
    it('should include eventID when provided', async () => {
      const payload = {
        event_config: {
          event_name: 'Purchase',
          show_fields: false
        },
        content_ids: ['product-123'],
        value: 99.99,
        eventID: 'unique-event-id-123'
      }

      await send(mockFbq, mockClientParamBuilder, payload, defaultSettings, mockAnalytics)

      expect(mockFbq).toHaveBeenCalledWith(
        'trackSingle',
        'test-pixel-123',
        'Purchase',
        expect.any(Object),
        {
          eventID: 'unique-event-id-123'
        }
      )
    })

    it('should include eventSourceUrl when provided', async () => {
      const payload = {
        event_config: {
          event_name: 'Purchase',
          show_fields: false
        },
        content_ids: ['product-123'],
        value: 99.99,
        eventSourceUrl: 'https://example.com/checkout'
      }

      await send(mockFbq, mockClientParamBuilder, payload, defaultSettings, mockAnalytics)

      expect(mockFbq).toHaveBeenCalledWith(
        'trackSingle',
        'test-pixel-123',
        'Purchase',
        expect.any(Object),
        {
          eventSourceUrl: 'https://example.com/checkout'
        }
      )
    })

    it('should include both eventID and eventSourceUrl when provided', async () => {
      const payload = {
        event_config: {
          event_name: 'Purchase',
          show_fields: false
        },
        content_ids: ['product-123'],
        value: 99.99,
        eventID: 'unique-event-id-123',
        eventSourceUrl: 'https://example.com/checkout'
      }

      await send(mockFbq, mockClientParamBuilder, payload, defaultSettings, mockAnalytics)

      expect(mockFbq).toHaveBeenCalledWith(
        'trackSingle',
        'test-pixel-123',
        'Purchase',
        expect.any(Object),
        {
          eventID: 'unique-event-id-123',
          eventSourceUrl: 'https://example.com/checkout'
        }
      )
    })
  })

  describe('send - Event Data Fields', () => {
    it('should include all event fields when show_fields is true', async () => {
      const payload = {
        event_config: {
          event_name: 'Purchase',
          show_fields: true
        },
        content_ids: ['product-123'],
        content_name: 'Test Product',
        content_category: 'Electronics',
        content_type: 'product',
        value: 99.99,
        currency: 'USD',
        num_items: 1,
        delivery_category: 'home_delivery'
      }

      await send(mockFbq, mockClientParamBuilder, payload, defaultSettings, mockAnalytics)

      expect(mockFbq).toHaveBeenCalledWith(
        'trackSingle',
        'test-pixel-123',
        'Purchase',
        {
          partner_agent: 'segment',
          content_ids: ['product-123'],
          content_name: 'Test Product',
          content_category: 'Electronics',
          content_type: 'product',
          value: 99.99,
          currency: 'USD',
          num_items: 1,
          delivery_category: 'home_delivery'
        },
        undefined
      )
    })

    it('should include predicted_ltv for Subscribe event', async () => {
      const payload = {
        event_config: {
          event_name: 'Subscribe',
          show_fields: false
        },
        predicted_ltv: 500.0,
        value: 50.0
      }

      await send(mockFbq, mockClientParamBuilder, payload, defaultSettings, mockAnalytics)

      expect(mockFbq).toHaveBeenCalledWith(
        'trackSingle',
        'test-pixel-123',
        'Subscribe',
        {
          partner_agent: 'segment',
          predicted_ltv: 500.0,
          value: 50.0
        },
        undefined
      )
    })

    it('should include net_revenue for Purchase event', async () => {
      const payload = {
        event_config: {
          event_name: 'Purchase',
          show_fields: false
        },
        content_ids: ['product-123'],
        net_revenue: 450.0,
        value: 50.0
      }

      await send(mockFbq, mockClientParamBuilder, payload, defaultSettings, mockAnalytics)

      expect(mockFbq).toHaveBeenCalledWith(
        'trackSingle',
        'test-pixel-123',
        'Purchase',
        {
          partner_agent: 'segment',
          content_ids: ['product-123'],
          net_revenue: 450.0,
          value: 50.0
        },
        undefined
      )
    })

    it('should include custom_data', async () => {
      const payload = {
        event_config: {
          event_name: 'Purchase',
          show_fields: false
        },
        content_ids: ['product-123'],
        value: 99.99,
        custom_data: {
          order_id: 'order-789',
          campaign_id: 'summer-sale',
          user_tier: 'premium'
        }
      }

      await send(mockFbq, mockClientParamBuilder, payload, defaultSettings, mockAnalytics)

      expect(mockFbq).toHaveBeenCalledWith(
        'trackSingle',
        'test-pixel-123',
        'Purchase',
        {
          partner_agent: 'segment',
          content_ids: ['product-123'],
          value: 99.99,
          custom_data: {
            order_id: 'order-789',
            campaign_id: 'summer-sale',
            user_tier: 'premium'
          }
        },
        undefined
      )
    })

    it('should not include empty arrays or objects', async () => {
      const payload = {
        event_config: {
          event_name: 'PageView',
          show_fields: false
        },
        content_ids: [],
        contents: [],
        custom_data: {}
      }

      await send(mockFbq, mockClientParamBuilder, payload, defaultSettings, mockAnalytics)

      const eventData = (mockFbq).mock.calls[0][3]
      expect(eventData).toEqual({ partner_agent: 'segment' })
    })

    it('should handle numeric values correctly including zero', async () => {
      const payload = {
        event_config: {
          event_name: 'InitiateCheckout',
          show_fields: false
        },
        content_ids: ['product-123'],
        value: 0,
        num_items: 0
      }

      await send(mockFbq, mockClientParamBuilder, payload, defaultSettings, mockAnalytics)

      expect(mockFbq).toHaveBeenCalledWith(
        'trackSingle',
        'test-pixel-123',
        'InitiateCheckout',
        {
          partner_agent: 'segment',
          content_ids: ['product-123'],
          value: 0,
          num_items: 0
        },
        undefined
      )
    })
  })

  describe('send - Client Param Builder (formatUserDataWithParamBuilder)', () => {
    let mockClientParamBuilderInstance

    beforeEach(() => {
      mockClientParamBuilderInstance = {
        getNormalizedAndHashedPII: jest.fn(),
        processAndCollectAllParams: jest.fn(),
        getFbc: jest.fn(),
        getFbp: jest.fn()
      }
    })

    it('should use clientParamBuilder to format email when available', async () => {
      mockAnalytics.storage.get.mockReturnValue('0')
      mockClientParamBuilderInstance.getNormalizedAndHashedPII.mockReturnValue('hashed_email_value')

      const payload = {
        event_config: {
          event_name: 'Purchase',
          show_fields: false
        },
        content_ids: ['product-123'],
        value: 99.99,
        userData: {
          em: 'TEST@EXAMPLE.COM'
        }
      }

      await send(mockFbq, mockClientParamBuilderInstance, payload, defaultSettings, mockAnalytics)

      expect(mockClientParamBuilderInstance.processAndCollectAllParams).toHaveBeenCalled()
      expect(mockClientParamBuilderInstance.getNormalizedAndHashedPII).toHaveBeenCalledWith('TEST@EXAMPLE.COM', 'email')
      expect(mockFbq).toHaveBeenCalledWith('init', 'test-pixel-123', { em: 'hashed_email_value' })
    })

    it('should use clientParamBuilder to format phone number when available', async () => {
      mockAnalytics.storage.get.mockReturnValue('0')
      mockClientParamBuilderInstance.getNormalizedAndHashedPII.mockReturnValue('hashed_phone_value')

      const payload = {
        event_config: {
          event_name: 'Purchase',
          show_fields: false
        },
        content_ids: ['product-123'],
        value: 99.99,
        userData: {
          ph: '+1 (555) 123-4567'
        }
      }

      await send(mockFbq, mockClientParamBuilderInstance, payload, defaultSettings, mockAnalytics)

      expect(mockClientParamBuilderInstance.getNormalizedAndHashedPII).toHaveBeenCalledWith(
        '+1 (555) 123-4567',
        'phone'
      )
      expect(mockFbq).toHaveBeenCalledWith('init', 'test-pixel-123', { ph: 'hashed_phone_value' })
    })

    it('should use clientParamBuilder to format all PII fields', async () => {
      mockAnalytics.storage.get.mockReturnValue('0')
      mockClientParamBuilderInstance.getNormalizedAndHashedPII.mockImplementation((_, type) => {
        return `hashed_${type}_value`
      })

      const payload = {
        event_config: {
          event_name: 'Purchase',
          show_fields: false
        },
        content_ids: ['product-123'],
        value: 99.99,
        userData: {
          em: 'test@example.com',
          ph: '5551234567',
          fn: 'John',
          ln: 'Doe',
          ge: 'm',
          db: '1990-05-15',
          ct: 'San Francisco',
          st: 'CA',
          zp: '94102',
          country: 'US',
          external_id: 'user-123'
        }
      }

      await send(mockFbq, mockClientParamBuilderInstance, payload, defaultSettings, mockAnalytics)

      expect(mockClientParamBuilderInstance.getNormalizedAndHashedPII).toHaveBeenCalledWith('test@example.com', 'email')
      expect(mockClientParamBuilderInstance.getNormalizedAndHashedPII).toHaveBeenCalledWith('5551234567', 'phone')
      expect(mockClientParamBuilderInstance.getNormalizedAndHashedPII).toHaveBeenCalledWith('John', 'first_name')
      expect(mockClientParamBuilderInstance.getNormalizedAndHashedPII).toHaveBeenCalledWith('Doe', 'last_name')
      expect(mockClientParamBuilderInstance.getNormalizedAndHashedPII).toHaveBeenCalledWith('m', 'gender')
      expect(mockClientParamBuilderInstance.getNormalizedAndHashedPII).toHaveBeenCalledWith('1990-05-15', 'date_of_birth')
      expect(mockClientParamBuilderInstance.getNormalizedAndHashedPII).toHaveBeenCalledWith('San Francisco', 'city')
      expect(mockClientParamBuilderInstance.getNormalizedAndHashedPII).toHaveBeenCalledWith('CA', 'state')
      expect(mockClientParamBuilderInstance.getNormalizedAndHashedPII).toHaveBeenCalledWith('94102', 'zip_code')
      expect(mockClientParamBuilderInstance.getNormalizedAndHashedPII).toHaveBeenCalledWith('US', 'country')
      expect(mockClientParamBuilderInstance.getNormalizedAndHashedPII).toHaveBeenCalledWith('user-123', 'external_id')

      expect(mockFbq).toHaveBeenCalledWith(
        'init',
        'test-pixel-123',
        {
          em: 'hashed_email_value',
          ph: 'hashed_phone_value',
          fn: 'hashed_first_name_value',
          ln: 'hashed_last_name_value',
          ge: 'hashed_gender_value',
          db: 'hashed_date_of_birth_value',
          ct: 'hashed_city_value',
          st: 'hashed_state_value',
          zp: 'hashed_zip_code_value',
          country: 'hashed_country_value',
          external_id: 'hashed_external_id_value'
        }
      )
    })

    it('should use clientParamBuilder getFbc and getFbp methods', async () => {
      mockAnalytics.storage.get.mockReturnValue('0')
      mockClientParamBuilderInstance.getFbc.mockReturnValue('fb.1.1234567890.ClientParamBuilderFbc')
      mockClientParamBuilderInstance.getFbp.mockReturnValue('fb.1.1234567890.ClientParamBuilderFbp')
      mockClientParamBuilderInstance.getNormalizedAndHashedPII.mockReturnValue('hashed_email')

      const payload = {
        event_config: {
          event_name: 'Purchase',
          show_fields: false
        },
        content_ids: ['product-123'],
        value: 99.99,
        userData: {
          em: 'test@example.com',
          fbc: 'fb.1.1234567890.PayloadFbc',
          fbp: 'fb.1.1234567890.PayloadFbp'
        }
      }

      await send(mockFbq, mockClientParamBuilderInstance, payload, defaultSettings, mockAnalytics)

      expect(mockClientParamBuilderInstance.processAndCollectAllParams).toHaveBeenCalled()
      expect(mockClientParamBuilderInstance.getFbc).toHaveBeenCalled()
      expect(mockClientParamBuilderInstance.getFbp).toHaveBeenCalled()

      // ClientParamBuilder values should override payload values
      expect(mockFbq).toHaveBeenCalledWith(
        'init',
        'test-pixel-123',
        {
          em: 'hashed_email',
          fbc: 'fb.1.1234567890.ClientParamBuilderFbc',
          fbp: 'fb.1.1234567890.ClientParamBuilderFbp'
        }
      )
    })

    it('should use payload fbc/fbp when clientParamBuilder methods return null', async () => {
      mockAnalytics.storage.get.mockReturnValue('0')
      mockClientParamBuilderInstance.getFbc.mockReturnValue(null)
      mockClientParamBuilderInstance.getFbp.mockReturnValue(null)
      mockClientParamBuilderInstance.getNormalizedAndHashedPII.mockReturnValue('hashed_email')

      const payload = {
        event_config: {
          event_name: 'Purchase',
          show_fields: false
        },
        content_ids: ['product-123'],
        value: 99.99,
        userData: {
          em: 'test@example.com',
          fbc: 'fb.1.1234567890.PayloadFbc',
          fbp: 'fb.1.1234567890.PayloadFbp'
        }
      }

      await send(mockFbq, mockClientParamBuilderInstance, payload, defaultSettings, mockAnalytics)

      expect(mockClientParamBuilderInstance.getFbc).toHaveBeenCalled()
      expect(mockClientParamBuilderInstance.getFbp).toHaveBeenCalled()

      // Should fall back to payload values when clientParamBuilder returns null
      expect(mockFbq).toHaveBeenCalledWith(
        'init',
        'test-pixel-123',
        {
          em: 'hashed_email',
          fbc: 'fb.1.1234567890.PayloadFbc',
          fbp: 'fb.1.1234567890.PayloadFbp'
        }
      )
    })

    it('should fall back to default formatting when clientParamBuilder returns undefined', async () => {
      mockAnalytics.storage.get.mockReturnValue('0')
      mockClientParamBuilderInstance.getNormalizedAndHashedPII.mockReturnValue(undefined)

      const payload = {
        event_config: {
          event_name: 'Purchase',
          show_fields: false
        },
        content_ids: ['product-123'],
        value: 99.99,
        userData: {
          em: 'TEST@EXAMPLE.COM',
          ph: '(555) 123-4567'
        }
      }

      await send(mockFbq, mockClientParamBuilderInstance, payload, defaultSettings, mockAnalytics)

      expect(mockClientParamBuilderInstance.getNormalizedAndHashedPII).toHaveBeenCalledWith('TEST@EXAMPLE.COM', 'email')
      expect(mockClientParamBuilderInstance.getNormalizedAndHashedPII).toHaveBeenCalledWith('(555) 123-4567', 'phone')

      // When clientParamBuilder returns undefined, nothing should be sent (empty userData)
      const initCalls = (mockFbq).mock.calls.filter((call) => call[0] === 'init')
      expect(initCalls.length).toBe(0)
    })

    it('should call processAndCollectAllParams before getting cookie values', async () => {
      mockAnalytics.storage.get.mockReturnValue('0')
      mockClientParamBuilderInstance.getFbc.mockReturnValue('fb.1.fbc')
      mockClientParamBuilderInstance.getFbp.mockReturnValue('fb.1.fbp')
      mockClientParamBuilderInstance.getNormalizedAndHashedPII.mockReturnValue('hashed_email')

      const payload = {
        event_config: {
          event_name: 'Purchase',
          show_fields: false
        },
        content_ids: ['product-123'],
        value: 99.99,
        userData: {
          em: 'test@example.com'
        }
      }

      await send(mockFbq, mockClientParamBuilderInstance, payload, defaultSettings, mockAnalytics)

      const calls = mockClientParamBuilderInstance.processAndCollectAllParams.mock.invocationCallOrder
      const fbcCalls = mockClientParamBuilderInstance.getFbc.mock.invocationCallOrder
      const fbpCalls = mockClientParamBuilderInstance.getFbp.mock.invocationCallOrder

      // processAndCollectAllParams should be called before getFbc/getFbp
      expect(calls[0]).toBeLessThan(fbcCalls[0])
      expect(calls[0]).toBeLessThan(fbpCalls[0])
    })

    it('should work correctly when clientParamBuilder is undefined', async () => {
      mockAnalytics.storage.get.mockReturnValue('0')

      const payload = {
        event_config: {
          event_name: 'Purchase',
          show_fields: false
        },
        content_ids: ['product-123'],
        value: 99.99,
        userData: {
          em: 'TEST@EXAMPLE.COM',
          ph: '(555) 123-4567'
        }
      }

      // Pass undefined for clientParamBuilder
      await send(mockFbq, undefined, payload, defaultSettings, mockAnalytics)

      // Should use default formatting (normalize and hash)
      expect(mockFbq).toHaveBeenCalledWith(
        'init',
        'test-pixel-123',
        {
          em: '973dfe463ec85785f5f95af5ba3906eedb2d931c24e69824a89ea65dba4e813b',
          ph: '3c95277da5fd0da6a1a44ee3fdf56d20af6c6d242695a40e18e6e90dc3c5872c'
        }
      )
    })
  })
})
