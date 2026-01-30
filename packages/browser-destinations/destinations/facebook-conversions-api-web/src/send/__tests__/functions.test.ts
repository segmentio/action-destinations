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
    it('should send Purchase event with required fields', () => {
      const payload = {
        event_config: {
          event_name: 'Purchase',
          show_fields: false
        },
        content_ids: ['product-123'],
        value: 99.99,
        currency: 'USD'
      }

      send(mockFbq, mockClientParamBuilder, payload, defaultSettings, mockAnalytics)

      expect(mockFbq).toHaveBeenCalledWith(
        'trackSingle',
        'test-pixel-123',
        'Purchase',
        expect.objectContaining({
          content_ids: ['product-123'],
          value: 99.99,
          currency: 'USD'
        }),
        undefined
      )
    })

    it('should send AddToCart event with contents', () => {
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

      send(mockFbq, mockClientParamBuilder, payload, defaultSettings, mockAnalytics)

      expect(mockFbq).toHaveBeenCalledWith(
        'trackSingle',
        'test-pixel-123',
        'AddToCart',
        expect.objectContaining({
          contents: [{ id: 'product-123', quantity: 2, item_price: 49.99 }],
          value: 99.98,
          currency: 'USD'
        }),
        undefined
      )
    })

    it('should send ViewContent event', () => {
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

      send(mockFbq, mockClientParamBuilder, payload, defaultSettings, mockAnalytics)

      expect(mockFbq).toHaveBeenCalledWith(
        'trackSingle',
        'test-pixel-123',
        'ViewContent',
        expect.objectContaining({
          content_ids: ['product-456'],
          content_name: 'Test Product',
          content_category: 'Electronics',
          value: 199.99
        }),
        undefined
      )
    })

    it('should send PageView event', () => {
      const payload = {
        event_config: {
          event_name: 'PageView',
          show_fields: false
        }
      }

      send(mockFbq, mockClientParamBuilder, payload, defaultSettings, mockAnalytics)

      expect(mockFbq).toHaveBeenCalledWith('trackSingle', 'test-pixel-123', 'PageView', {}, undefined)
    })
  })

  describe('send - Custom Events', () => {
    it('should send custom event with custom event name', () => {
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

      send(mockFbq, mockClientParamBuilder, payload, defaultSettings, mockAnalytics)

      expect(mockFbq).toHaveBeenCalledWith(
        'trackSingleCustom',
        'test-pixel-123',
        'MyCustomEvent',
        expect.objectContaining({
          value: 50.0,
          custom_data: {
            custom_field_1: 'value1',
            custom_field_2: 'value2'
          }
        }),
        undefined
      )
    })
  })

  describe('send - Validation', () => {
    it('should warn if AddToCart is missing both content_ids and contents', () => {
      const payload = {
        event_config: {
          event_name: 'AddToCart',
          show_fields: false
        },
        value: 99.99
      }

      send(mockFbq, mockClientParamBuilder, payload, defaultSettings, mockAnalytics)

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('At least one of content_ids or contents is required for the AddToCart event')
      )
      expect(mockFbq).not.toHaveBeenCalled()
    })

    it('should warn if Purchase is missing both content_ids and contents', () => {
      const payload = {
        event_config: {
          event_name: 'Purchase',
          show_fields: false
        },
        value: 199.99,
        currency: 'USD'
      }

      send(mockFbq, mockClientParamBuilder, payload, defaultSettings, mockAnalytics)

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('At least one of content_ids or contents is required for the Purchase event')
      )
      expect(mockFbq).not.toHaveBeenCalled()
    })

    it('should warn if ViewContent is missing both content_ids and contents', () => {
      const payload = {
        event_config: {
          event_name: 'ViewContent',
          show_fields: false
        }
      }

      send(mockFbq, mockClientParamBuilder, payload, defaultSettings, mockAnalytics)

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('At least one of content_ids or contents is required for the ViewContent event')
      )
      expect(mockFbq).not.toHaveBeenCalled()
    })

    it('should not warn if AddToCart has content_ids', () => {
      const payload = {
        event_config: {
          event_name: 'AddToCart',
          show_fields: false
        },
        content_ids: ['product-123'],
        value: 99.99
      }

      send(mockFbq, mockClientParamBuilder, payload, defaultSettings, mockAnalytics)

      expect(consoleWarnSpy).not.toHaveBeenCalled()
      expect(mockFbq).toHaveBeenCalled()
    })

    it('should not warn if AddToCart has contents', () => {
      const payload = {
        event_config: {
          event_name: 'AddToCart',
          show_fields: false
        },
        contents: [{ id: 'product-123', quantity: 1 }],
        value: 99.99
      }

      send(mockFbq, mockClientParamBuilder, payload, defaultSettings, mockAnalytics)

      expect(consoleWarnSpy).not.toHaveBeenCalled()
      expect(mockFbq).toHaveBeenCalled()
    })
  })

  describe('send - Event Options', () => {
    it('should include eventID when provided', () => {
      const payload = {
        event_config: {
          event_name: 'Purchase',
          show_fields: false
        },
        content_ids: ['product-123'],
        value: 99.99,
        eventID: 'unique-event-id-123'
      }

      send(mockFbq, mockClientParamBuilder, payload, defaultSettings, mockAnalytics)

      expect(mockFbq).toHaveBeenCalledWith(
        'trackSingle',
        'test-pixel-123',
        'Purchase',
        expect.any(Object),
        expect.objectContaining({
          eventID: 'unique-event-id-123'
        })
      )
    })

    it('should include eventSourceUrl when provided', () => {
      const payload = {
        event_config: {
          event_name: 'Purchase',
          show_fields: false
        },
        content_ids: ['product-123'],
        value: 99.99,
        eventSourceUrl: 'https://example.com/checkout'
      }

      send(mockFbq, mockClientParamBuilder, payload, defaultSettings, mockAnalytics)

      expect(mockFbq).toHaveBeenCalledWith(
        'trackSingle',
        'test-pixel-123',
        'Purchase',
        expect.any(Object),
        expect.objectContaining({
          eventSourceUrl: 'https://example.com/checkout'
        })
      )
    })

    it('should include both eventID and eventSourceUrl when provided', () => {
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

      send(mockFbq, mockClientParamBuilder, payload, defaultSettings, mockAnalytics)

      expect(mockFbq).toHaveBeenCalledWith(
        'trackSingle',
        'test-pixel-123',
        'Purchase',
        expect.any(Object),
        expect.objectContaining({
          eventID: 'unique-event-id-123',
          eventSourceUrl: 'https://example.com/checkout'
        })
      )
    })
  })

  describe('send - User Data Formatting', () => {
    it('should format userData with email', () => {
      mockAnalytics.storage.get.mockReturnValue('0')

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

      send(mockFbq, mockClientParamBuilder, payload, defaultSettings, mockAnalytics)

      // Should have called init with formatted user data
      expect(mockFbq).toHaveBeenCalledWith(
        'init',
        'test-pixel-123',
        expect.objectContaining({ em: 'test@example.com' })
      )
      // Should have stored user data
      expect(mockAnalytics.storage.set).toHaveBeenCalledWith(
        'fb_user_data',
        expect.stringContaining('test@example.com')
      )
    })

    it('should format userData with phone number', () => {
      mockAnalytics.storage.get.mockReturnValue('0')

      const payload = {
        event_config: {
          event_name: 'Purchase',
          show_fields: false
        },
        content_ids: ['product-123'],
        value: 99.99,
        userData: {
          ph: '(555) 123-4567'
        }
      }

      send(mockFbq, mockClientParamBuilder, payload, defaultSettings, mockAnalytics)

      // Phone should be cleaned of non-numeric characters
      expect(mockFbq).toHaveBeenCalledWith('init', 'test-pixel-123', expect.objectContaining({ ph: '5551234567' }))
    })

    it('should format userData with first and last name', () => {
      mockAnalytics.storage.get.mockReturnValue('0')

      const payload = {
        event_config: {
          event_name: 'Purchase',
          show_fields: false
        },
        content_ids: ['product-123'],
        value: 99.99,
        userData: {
          fn: ' JOHN ',
          ln: ' DOE '
        }
      }

      send(mockFbq, mockClientParamBuilder, payload, defaultSettings, mockAnalytics)

      // Names should be lowercased and trimmed
      expect(mockFbq).toHaveBeenCalledWith('init', 'test-pixel-123', expect.objectContaining({ fn: 'john', ln: 'doe' }))
    })

    it('should format userData with gender', () => {
      mockAnalytics.storage.get.mockReturnValue('0')

      const payload = {
        event_config: {
          event_name: 'Purchase',
          show_fields: false
        },
        content_ids: ['product-123'],
        value: 99.99,
        userData: {
          ge: 'm'
        }
      }

      send(mockFbq, mockClientParamBuilder, payload, defaultSettings, mockAnalytics)

      expect(mockFbq).toHaveBeenCalledWith('init', 'test-pixel-123', expect.objectContaining({ ge: 'm' }))
    })

    it('should format userData with date of birth', () => {
      mockAnalytics.storage.get.mockReturnValue('0')

      const payload = {
        event_config: {
          event_name: 'Purchase',
          show_fields: false
        },
        content_ids: ['product-123'],
        value: 99.99,
        userData: {
          db: '1990-05-15T00:00:00.000Z'
        }
      }

      send(mockFbq, mockClientParamBuilder, payload, defaultSettings, mockAnalytics)

      // Date should be formatted as YYYYMMDD
      expect(mockFbq).toHaveBeenCalledWith('init', 'test-pixel-123', expect.objectContaining({ db: '19900515' }))
    })

    it('should format userData with city', () => {
      mockAnalytics.storage.get.mockReturnValue('0')

      const payload = {
        event_config: {
          event_name: 'Purchase',
          show_fields: false
        },
        content_ids: ['product-123'],
        value: 99.99,
        userData: {
          ct: ' New York '
        }
      }

      send(mockFbq, mockClientParamBuilder, payload, defaultSettings, mockAnalytics)

      // City should be lowercased with spaces removed
      expect(mockFbq).toHaveBeenCalledWith('init', 'test-pixel-123', expect.objectContaining({ ct: 'newyork' }))
    })

    it('should format userData with US state - full name to code', () => {
      mockAnalytics.storage.get.mockReturnValue('0')

      const payload = {
        event_config: {
          event_name: 'Purchase',
          show_fields: false
        },
        content_ids: ['product-123'],
        value: 99.99,
        userData: {
          st: 'California'
        }
      }

      send(mockFbq, mockClientParamBuilder, payload, defaultSettings, mockAnalytics)

      // State should be converted to 2-letter code
      expect(mockFbq).toHaveBeenCalledWith('init', 'test-pixel-123', expect.objectContaining({ st: 'ca' }))
    })

    it('should format userData with US state - already 2-letter code', () => {
      mockAnalytics.storage.get.mockReturnValue('0')

      const payload = {
        event_config: {
          event_name: 'Purchase',
          show_fields: false
        },
        content_ids: ['product-123'],
        value: 99.99,
        userData: {
          st: 'NY'
        }
      }

      send(mockFbq, mockClientParamBuilder, payload, defaultSettings, mockAnalytics)

      // State code should be lowercased
      expect(mockFbq).toHaveBeenCalledWith('init', 'test-pixel-123', expect.objectContaining({ st: 'ny' }))
    })

    it('should format userData with country - full name to code', () => {
      mockAnalytics.storage.get.mockReturnValue('0')

      const payload = {
        event_config: {
          event_name: 'Purchase',
          show_fields: false
        },
        content_ids: ['product-123'],
        value: 99.99,
        userData: {
          country: 'United States'
        }
      }

      send(mockFbq, mockClientParamBuilder, payload, defaultSettings, mockAnalytics)

      // Country should be converted to 2-letter code
      expect(mockFbq).toHaveBeenCalledWith('init', 'test-pixel-123', expect.objectContaining({ country: 'us' }))
    })

    it('should format userData with country - already 2-letter code', () => {
      mockAnalytics.storage.get.mockReturnValue('0')

      const payload = {
        event_config: {
          event_name: 'Purchase',
          show_fields: false
        },
        content_ids: ['product-123'],
        value: 99.99,
        userData: {
          country: 'GB'
        }
      }

      send(mockFbq, mockClientParamBuilder, payload, defaultSettings, mockAnalytics)

      // Country code should be lowercased
      expect(mockFbq).toHaveBeenCalledWith('init', 'test-pixel-123', expect.objectContaining({ country: 'gb' }))
    })

    it('should format userData with zip code', () => {
      mockAnalytics.storage.get.mockReturnValue('0')

      const payload = {
        event_config: {
          event_name: 'Purchase',
          show_fields: false
        },
        content_ids: ['product-123'],
        value: 99.99,
        userData: {
          zp: ' 94102 '
        }
      }

      send(mockFbq, mockClientParamBuilder, payload, defaultSettings, mockAnalytics)

      // Zip should be trimmed
      expect(mockFbq).toHaveBeenCalledWith('init', 'test-pixel-123', expect.objectContaining({ zp: '94102' }))
    })

    it('should format userData with external_id', () => {
      mockAnalytics.storage.get.mockReturnValue('0')

      const payload = {
        event_config: {
          event_name: 'Purchase',
          show_fields: false
        },
        content_ids: ['product-123'],
        value: 99.99,
        userData: {
          external_id: ' user-123 '
        }
      }

      send(mockFbq, mockClientParamBuilder, payload, defaultSettings, mockAnalytics)

      // External ID should be trimmed
      expect(mockFbq).toHaveBeenCalledWith(
        'init',
        'test-pixel-123',
        expect.objectContaining({ external_id: 'user-123' })
      )
    })

    it('should format userData with fbp and fbc cookies', () => {
      mockAnalytics.storage.get.mockReturnValue('0')

      const payload = {
        event_config: {
          event_name: 'Purchase',
          show_fields: false
        },
        content_ids: ['product-123'],
        value: 99.99,
        userData: {
          fbp: ' fb.1.1234567890.1234567890 ',
          fbc: ' fb.1.1234567890.AbCdEf123 '
        }
      }

      send(mockFbq, mockClientParamBuilder, payload, defaultSettings, mockAnalytics)

      // FBP and FBC should be trimmed
      expect(mockFbq).toHaveBeenCalledWith(
        'init',
        'test-pixel-123',
        expect.objectContaining({
          fbp: 'fb.1.1234567890.1234567890',
          fbc: 'fb.1.1234567890.AbCdEf123'
        })
      )
    })

    it('should format userData with all fields combined', () => {
      mockAnalytics.storage.get.mockReturnValue('0')

      const payload = {
        event_config: {
          event_name: 'Purchase',
          show_fields: false
        },
        content_ids: ['product-123'],
        value: 99.99,
        userData: {
          external_id: 'user-123',
          em: 'test@example.com',
          ph: '5551234567',
          fn: 'John',
          ln: 'Doe',
          ge: 'm',
          db: '1990-05-15T00:00:00.000Z',
          ct: 'San Francisco',
          st: 'California',
          zp: '94102',
          country: 'United States',
          fbp: 'fb.1.1234567890.1234567890',
          fbc: 'fb.1.1234567890.AbCdEf123'
        }
      }

      send(mockFbq, mockClientParamBuilder, payload, defaultSettings, mockAnalytics)

      expect(mockFbq).toHaveBeenCalledWith(
        'init',
        'test-pixel-123',
        expect.objectContaining({
          external_id: 'user-123',
          em: 'test@example.com',
          ph: '5551234567',
          fn: 'john',
          ln: 'doe',
          ge: 'm',
          db: '19900515',
          ct: 'sanfrancisco',
          st: 'ca',
          zp: '94102',
          country: 'us',
          fbp: 'fb.1.1234567890.1234567890',
          fbc: 'fb.1.1234567890.AbCdEf123'
        })
      )
    })

    it('should not send userData init when init count is at max', () => {
      mockAnalytics.storage.get.mockReturnValue('2')

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

      send(mockFbq, mockClientParamBuilder, payload, defaultSettings, mockAnalytics)

      // Should not call init with user data when count is at max
      const initCalls = mockFbq.mock.calls.filter((call) => call[0] === 'init')
      expect(initCalls.length).toBe(0)
    })

    it('should skip invalid gender values', () => {
      mockAnalytics.storage.get.mockReturnValue('0')

      const payload = {
        event_config: {
          event_name: 'Purchase',
          show_fields: false
        },
        content_ids: ['product-123'],
        value: 99.99,
        userData: {
          ge: 'invalid'
        }
      }

      send(mockFbq, mockClientParamBuilder, payload, defaultSettings, mockAnalytics)

      // Should not call init if only invalid gender is provided
      const initCalls = mockFbq.mock.calls.filter((call) => call[0] === 'init')
      expect(initCalls.length).toBe(0)
    })

    it('should skip invalid date of birth', () => {
      mockAnalytics.storage.get.mockReturnValue('0')

      const payload = {
        event_config: {
          event_name: 'Purchase',
          show_fields: false
        },
        content_ids: ['product-123'],
        value: 99.99,
        userData: {
          db: 'invalid-date'
        }
      }

      send(mockFbq, mockClientParamBuilder, payload, defaultSettings, mockAnalytics)

      // Should not call init if only invalid date is provided
      const initCalls = mockFbq.mock.calls.filter((call) => call[0] === 'init')
      expect(initCalls.length).toBe(0)
    })
  })

  describe('send - Event Data Fields', () => {
    it('should include all event fields when show_fields is true', () => {
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

      send(mockFbq, mockClientParamBuilder, payload, defaultSettings, mockAnalytics)

      expect(mockFbq).toHaveBeenCalledWith(
        'trackSingle',
        'test-pixel-123',
        'Purchase',
        expect.objectContaining({
          content_ids: ['product-123'],
          content_name: 'Test Product',
          content_category: 'Electronics',
          content_type: 'product',
          value: 99.99,
          currency: 'USD',
          num_items: 1,
          delivery_category: 'home_delivery'
        }),
        undefined
      )
    })

    it('should include predicted_ltv for Subscribe event', () => {
      const payload = {
        event_config: {
          event_name: 'Subscribe',
          show_fields: false
        },
        predicted_ltv: 500.0,
        value: 50.0
      }

      send(mockFbq, mockClientParamBuilder, payload, defaultSettings, mockAnalytics)

      expect(mockFbq).toHaveBeenCalledWith(
        'trackSingle',
        'test-pixel-123',
        'Subscribe',
        expect.objectContaining({
          predicted_ltv: 500.0,
          value: 50.0
        }),
        undefined
      )
    })

    it('should include net_revenue for Purchase event', () => {
      const payload = {
        event_config: {
          event_name: 'Purchase',
          show_fields: false
        },
        content_ids: ['product-123'],
        net_revenue: 450.0,
        value: 50.0
      }

      send(mockFbq, mockClientParamBuilder, payload, defaultSettings, mockAnalytics)

      expect(mockFbq).toHaveBeenCalledWith(
        'trackSingle',
        'test-pixel-123',
        'Purchase',
        expect.objectContaining({
          net_revenue: 450.0,
          value: 50.0
        }),
        undefined
      )
    })

    it('should include custom_data', () => {
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

      send(mockFbq, mockClientParamBuilder, payload, defaultSettings, mockAnalytics)

      expect(mockFbq).toHaveBeenCalledWith(
        'trackSingle',
        'test-pixel-123',
        'Purchase',
        expect.objectContaining({
          custom_data: {
            order_id: 'order-789',
            campaign_id: 'summer-sale',
            user_tier: 'premium'
          }
        }),
        undefined
      )
    })

    it('should not include empty arrays or objects', () => {
      const payload = {
        event_config: {
          event_name: 'PageView',
          show_fields: false
        },
        content_ids: [],
        contents: [],
        custom_data: {}
      }

      send(mockFbq, mockClientParamBuilder, payload, defaultSettings, mockAnalytics)

      const eventData = mockFbq.mock.calls[0][3]
      expect(eventData).toEqual({})
    })

    it('should handle numeric values correctly including zero', () => {
      const payload = {
        event_config: {
          event_name: 'InitiateCheckout',
          show_fields: false
        },
        content_ids: ['product-123'],
        value: 0,
        num_items: 0
      }

      send(mockFbq, mockClientParamBuilder, payload, defaultSettings, mockAnalytics)

      expect(mockFbq).toHaveBeenCalledWith(
        'trackSingle',
        'test-pixel-123',
        'InitiateCheckout',
        expect.objectContaining({
          value: 0,
          num_items: 0
        }),
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

    it('should use clientParamBuilder to format email when available', () => {
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

      send(mockFbq, mockClientParamBuilderInstance, payload, defaultSettings, mockAnalytics)

      expect(mockClientParamBuilderInstance.processAndCollectAllParams).toHaveBeenCalled()
      expect(mockClientParamBuilderInstance.getNormalizedAndHashedPII).toHaveBeenCalledWith('TEST@EXAMPLE.COM', 'email')
      expect(mockFbq).toHaveBeenCalledWith(
        'init',
        'test-pixel-123',
        expect.objectContaining({ em: 'hashed_email_value' })
      )
    })

    it('should use clientParamBuilder to format phone number when available', () => {
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

      send(mockFbq, mockClientParamBuilderInstance, payload, defaultSettings, mockAnalytics)

      expect(mockClientParamBuilderInstance.getNormalizedAndHashedPII).toHaveBeenCalledWith(
        '+1 (555) 123-4567',
        'phone'
      )
      expect(mockFbq).toHaveBeenCalledWith(
        'init',
        'test-pixel-123',
        expect.objectContaining({ ph: 'hashed_phone_value' })
      )
    })

    it('should use clientParamBuilder to format all PII fields', () => {
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

      send(mockFbq, mockClientParamBuilderInstance, payload, defaultSettings, mockAnalytics)

      expect(mockClientParamBuilderInstance.getNormalizedAndHashedPII).toHaveBeenCalledWith('test@example.com', 'email')
      expect(mockClientParamBuilderInstance.getNormalizedAndHashedPII).toHaveBeenCalledWith('5551234567', 'phone')
      expect(mockClientParamBuilderInstance.getNormalizedAndHashedPII).toHaveBeenCalledWith('John', 'first_name')
      expect(mockClientParamBuilderInstance.getNormalizedAndHashedPII).toHaveBeenCalledWith('Doe', 'last_name')
      expect(mockClientParamBuilderInstance.getNormalizedAndHashedPII).toHaveBeenCalledWith('m', 'gender')
      expect(mockClientParamBuilderInstance.getNormalizedAndHashedPII).toHaveBeenCalledWith(
        '1990-05-15',
        'date_of_birth'
      )
      expect(mockClientParamBuilderInstance.getNormalizedAndHashedPII).toHaveBeenCalledWith('San Francisco', 'city')
      expect(mockClientParamBuilderInstance.getNormalizedAndHashedPII).toHaveBeenCalledWith('CA', 'state')
      expect(mockClientParamBuilderInstance.getNormalizedAndHashedPII).toHaveBeenCalledWith('94102', 'zip_code')
      expect(mockClientParamBuilderInstance.getNormalizedAndHashedPII).toHaveBeenCalledWith('US', 'country')
      expect(mockClientParamBuilderInstance.getNormalizedAndHashedPII).toHaveBeenCalledWith('user-123', 'external_id')

      expect(mockFbq).toHaveBeenCalledWith(
        'init',
        'test-pixel-123',
        expect.objectContaining({
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
        })
      )
    })

    it('should use clientParamBuilder getFbc and getFbp methods', () => {
      mockAnalytics.storage.get.mockReturnValue('0')
      mockClientParamBuilderInstance.getFbc.mockReturnValue('fb.1.1234567890.ClientParamBuilderFbc')
      mockClientParamBuilderInstance.getFbp.mockReturnValue('fb.1.1234567890.ClientParamBuilderFbp')

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

      send(mockFbq, mockClientParamBuilderInstance, payload, defaultSettings, mockAnalytics)

      expect(mockClientParamBuilderInstance.processAndCollectAllParams).toHaveBeenCalled()
      expect(mockClientParamBuilderInstance.getFbc).toHaveBeenCalled()
      expect(mockClientParamBuilderInstance.getFbp).toHaveBeenCalled()

      // ClientParamBuilder values should override payload values
      expect(mockFbq).toHaveBeenCalledWith(
        'init',
        'test-pixel-123',
        expect.objectContaining({
          fbc: 'fb.1.1234567890.ClientParamBuilderFbc',
          fbp: 'fb.1.1234567890.ClientParamBuilderFbp'
        })
      )
    })

    it('should use payload fbc/fbp when clientParamBuilder methods return null', () => {
      mockAnalytics.storage.get.mockReturnValue('0')
      mockClientParamBuilderInstance.getFbc.mockReturnValue(null)
      mockClientParamBuilderInstance.getFbp.mockReturnValue(null)

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

      send(mockFbq, mockClientParamBuilderInstance, payload, defaultSettings, mockAnalytics)

      expect(mockClientParamBuilderInstance.getFbc).toHaveBeenCalled()
      expect(mockClientParamBuilderInstance.getFbp).toHaveBeenCalled()

      // Should fall back to payload values when clientParamBuilder returns null
      expect(mockFbq).toHaveBeenCalledWith(
        'init',
        'test-pixel-123',
        expect.objectContaining({
          fbc: 'fb.1.1234567890.PayloadFbc',
          fbp: 'fb.1.1234567890.PayloadFbp'
        })
      )
    })

    it('should fall back to default formatting when clientParamBuilder returns undefined', () => {
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

      send(mockFbq, mockClientParamBuilderInstance, payload, defaultSettings, mockAnalytics)

      expect(mockClientParamBuilderInstance.getNormalizedAndHashedPII).toHaveBeenCalledWith('TEST@EXAMPLE.COM', 'email')
      expect(mockClientParamBuilderInstance.getNormalizedAndHashedPII).toHaveBeenCalledWith('(555) 123-4567', 'phone')

      // When clientParamBuilder returns undefined, should fall back to default formatting
      expect(mockFbq).toHaveBeenCalledWith(
        'init',
        'test-pixel-123',
        expect.objectContaining({
          em: 'test@example.com',
          ph: '5551234567'
        })
      )
    })

    it('should call processAndCollectAllParams before getting cookie values', () => {
      mockAnalytics.storage.get.mockReturnValue('0')
      mockClientParamBuilderInstance.getFbc.mockReturnValue('fb.1.fbc')
      mockClientParamBuilderInstance.getFbp.mockReturnValue('fb.1.fbp')

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

      send(mockFbq, mockClientParamBuilderInstance, payload, defaultSettings, mockAnalytics)

      const calls = mockClientParamBuilderInstance.processAndCollectAllParams.mock.invocationCallOrder
      const fbcCalls = mockClientParamBuilderInstance.getFbc.mock.invocationCallOrder
      const fbpCalls = mockClientParamBuilderInstance.getFbp.mock.invocationCallOrder

      // processAndCollectAllParams should be called before getFbc/getFbp
      expect(calls[0]).toBeLessThan(fbcCalls[0])
      expect(calls[0]).toBeLessThan(fbpCalls[0])
    })

    it('should work correctly when clientParamBuilder is undefined', () => {
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
      send(mockFbq, undefined, payload, defaultSettings, mockAnalytics)

      // Should use default formatting (lowercase and trim for email, digits only for phone)
      expect(mockFbq).toHaveBeenCalledWith(
        'init',
        'test-pixel-123',
        expect.objectContaining({
          em: 'test@example.com',
          ph: '5551234567'
        })
      )
    })
  })
})
