import { send } from '../functions'

describe('Facebook Conversions API Web - Init with User Data', () => {
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

  describe('init call with user data formatting', () => {
    it('should format userData with email', async () => {
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

      await send(mockFbq, mockClientParamBuilder, payload, defaultSettings, mockAnalytics)

      // Email should be normalized (lowercase, trimmed) and hashed with SHA256
      // 'test@example.com' -> '973dfe463ec85785f5f95af5ba3906eedb2d931c24e69824a89ea65dba4e813b'
      expect(mockFbq).toHaveBeenCalledWith('init', 'test-pixel-123', {
        em: '973dfe463ec85785f5f95af5ba3906eedb2d931c24e69824a89ea65dba4e813b'
      })
      // Should have stored user data
      expect(mockAnalytics.storage.set).toHaveBeenCalledWith(
        'fb_user_data',
        expect.stringContaining('973dfe463ec85785f5f95af5ba3906eedb2d931c24e69824a89ea65dba4e813b')
      )
    })

    it('should format userData with phone number', async () => {
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

      await send(mockFbq, mockClientParamBuilder, payload, defaultSettings, mockAnalytics)

      // Phone should be cleaned of non-numeric characters then hashed
      // '5551234567' -> '3c95277da5fd0da6a1a44ee3fdf56d20af6c6d242695a40e18e6e90dc3c5872c'
      expect(mockFbq).toHaveBeenCalledWith('init', 'test-pixel-123', {
        ph: '3c95277da5fd0da6a1a44ee3fdf56d20af6c6d242695a40e18e6e90dc3c5872c'
      })
    })

    it('should format userData with first and last name', async () => {
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

      await send(mockFbq, mockClientParamBuilder, payload, defaultSettings, mockAnalytics)

      // Names should be lowercased and trimmed, then hashed
      // 'john' -> '96d9632f363564cc3032521409cf22a852f2032eec099ed5967c0d000cec607a'
      // 'doe' -> '799ef92a11af918e3fb741df42934f3b568ed2d93ac1df74f1b8d41a27932a6f'
      expect(mockFbq).toHaveBeenCalledWith(
        'init',
        'test-pixel-123',
        {
          fn: '96d9632f363564cc3032521409cf22a852f2032eec099ed5967c0d000cec607a',
          ln: '799ef92a11af918e3fb741df42934f3b568ed2d93ac1df74f1b8d41a27932a6f'
        }
      )
    })

    it('should format userData with gender', async () => {
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

      await send(mockFbq, mockClientParamBuilder, payload, defaultSettings, mockAnalytics)

      // 'm' -> '62c66a7a5dd70c3146618063c344e531e6d4b59e379808443ce962b3abd63c5a'
      expect(mockFbq).toHaveBeenCalledWith('init', 'test-pixel-123', {
        ge: '62c66a7a5dd70c3146618063c344e531e6d4b59e379808443ce962b3abd63c5a'
      })
    })

    it('should format userData with date of birth', async () => {
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

      await send(mockFbq, mockClientParamBuilder, payload, defaultSettings, mockAnalytics)

      // Date should be formatted as YYYYMMDD then hashed
      // '19900515' -> '53058fbd6731774c37a6d838c09d25b337fa7b9b5007f82cc934d857d2596e0c'
      expect(mockFbq).toHaveBeenCalledWith('init', 'test-pixel-123', {
        db: '53058fbd6731774c37a6d838c09d25b337fa7b9b5007f82cc934d857d2596e0c'
      })
    })

    it('should format userData with city', async () => {
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

      await send(mockFbq, mockClientParamBuilder, payload, defaultSettings, mockAnalytics)

      // City should be lowercased with spaces removed, then hashed
      // 'newyork' -> '350c754ba4d38897693aa077ef43072a859d23f613443133fecbbd90a3512ca5'
      expect(mockFbq).toHaveBeenCalledWith('init', 'test-pixel-123', {
        ct: '350c754ba4d38897693aa077ef43072a859d23f613443133fecbbd90a3512ca5'
      })
    })

    it('should format userData with US state - full name to code', async () => {
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

      await send(mockFbq, mockClientParamBuilder, payload, defaultSettings, mockAnalytics)

      // State should be converted to 2-letter code, then hashed
      // 'ca' -> '6959097001d10501ac7d54c0bdb8db61420f658f2922cc26e46d536119a31126'
      expect(mockFbq).toHaveBeenCalledWith('init', 'test-pixel-123', {
        st: '6959097001d10501ac7d54c0bdb8db61420f658f2922cc26e46d536119a31126'
      })
    })

    it('should format userData with US state - already 2-letter code', async () => {
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

      await send(mockFbq, mockClientParamBuilder, payload, defaultSettings, mockAnalytics)

      // State code should be lowercased, then hashed
      // 'ny' -> '1b06e2003f8420d6fa42badd8f77ec0f706b976b7a48b13c567dc5a559681683'
      expect(mockFbq).toHaveBeenCalledWith('init', 'test-pixel-123', {
        st: '1b06e2003f8420d6fa42badd8f77ec0f706b976b7a48b13c567dc5a559681683'
      })
    })

    it('should format userData with country - full name to code', async () => {
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

      await send(mockFbq, mockClientParamBuilder, payload, defaultSettings, mockAnalytics)

      // Country should be converted to 2-letter code, then hashed
      // 'us' -> '79adb2a2fce5c6ba215fe5f27f532d4e7edbac4b6a5e09e1ef3a08084a904621'
      expect(mockFbq).toHaveBeenCalledWith('init', 'test-pixel-123', {
        country: '79adb2a2fce5c6ba215fe5f27f532d4e7edbac4b6a5e09e1ef3a08084a904621'
      })
    })

    it('should format userData with country - already 2-letter code', async () => {
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

      await send(mockFbq, mockClientParamBuilder, payload, defaultSettings, mockAnalytics)

      // Country code should be lowercased, then hashed
      // 'gb' -> '0b407281768f0e833afef47ed464b6571d01ca4d53c12ce5c51d1462f4ad6677'
      expect(mockFbq).toHaveBeenCalledWith('init', 'test-pixel-123', {
        country: '0b407281768f0e833afef47ed464b6571d01ca4d53c12ce5c51d1462f4ad6677'
      })
    })

    it('should format userData with zip code', async () => {
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

      await send(mockFbq, mockClientParamBuilder, payload, defaultSettings, mockAnalytics)

      // Zip should be trimmed, then hashed
      // '94102' -> '8137c19c8f35f6b6a1cce99753226e1c7211eaaebd68528b789f973b0be95e31'
      expect(mockFbq).toHaveBeenCalledWith('init', 'test-pixel-123', {
        zp: '8137c19c8f35f6b6a1cce99753226e1c7211eaaebd68528b789f973b0be95e31'
      })
    })

    it('should format userData with external_id', async () => {
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

      await send(mockFbq, mockClientParamBuilder, payload, defaultSettings, mockAnalytics)

      // External ID should be trimmed, then hashed
      // 'user-123' -> 'fcdec6df4d44dbc637c7c5b58efface52a7f8a88535423430255be0bb89bedd8'
      expect(mockFbq).toHaveBeenCalledWith('init', 'test-pixel-123', {
        external_id: 'fcdec6df4d44dbc637c7c5b58efface52a7f8a88535423430255be0bb89bedd8'
      })
    })

    it('should format userData with fbp and fbc cookies', async () => {
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

      await send(mockFbq, mockClientParamBuilder, payload, defaultSettings, mockAnalytics)

      // FBP and FBC should be trimmed but NOT hashed
      expect(mockFbq).toHaveBeenCalledWith(
        'init',
        'test-pixel-123',
        {
          fbp: 'fb.1.1234567890.1234567890',
          fbc: 'fb.1.1234567890.AbCdEf123'
        }
      )
    })

    it('should format userData with all fields combined', async () => {
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

      await send(mockFbq, mockClientParamBuilder, payload, defaultSettings, mockAnalytics)

      // All PII fields should be normalized and hashed; fbc/fbp should NOT be hashed
      expect(mockFbq).toHaveBeenCalledWith(
        'init',
        'test-pixel-123',
        {
          external_id: 'fcdec6df4d44dbc637c7c5b58efface52a7f8a88535423430255be0bb89bedd8',
          em: '973dfe463ec85785f5f95af5ba3906eedb2d931c24e69824a89ea65dba4e813b',
          ph: '3c95277da5fd0da6a1a44ee3fdf56d20af6c6d242695a40e18e6e90dc3c5872c',
          fn: '96d9632f363564cc3032521409cf22a852f2032eec099ed5967c0d000cec607a',
          ln: '799ef92a11af918e3fb741df42934f3b568ed2d93ac1df74f1b8d41a27932a6f',
          ge: '62c66a7a5dd70c3146618063c344e531e6d4b59e379808443ce962b3abd63c5a',
          db: '53058fbd6731774c37a6d838c09d25b337fa7b9b5007f82cc934d857d2596e0c',
          ct: '1a6bd4d9d79dc0a79b53795c70d3349fa9e38968a3fbefbfe8783efb1d2b6aac',
          st: '6959097001d10501ac7d54c0bdb8db61420f658f2922cc26e46d536119a31126',
          zp: '8137c19c8f35f6b6a1cce99753226e1c7211eaaebd68528b789f973b0be95e31',
          country: '79adb2a2fce5c6ba215fe5f27f532d4e7edbac4b6a5e09e1ef3a08084a904621',
          fbp: 'fb.1.1234567890.1234567890',
          fbc: 'fb.1.1234567890.AbCdEf123'
        }
      )
    })

    it('should skip invalid gender values', async () => {
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

      await send(mockFbq, mockClientParamBuilder, payload, defaultSettings, mockAnalytics)

      // Should not call init if only invalid gender is provided
      const initCalls = (mockFbq).mock.calls.filter((call) => call[0] === 'init')
      expect(initCalls.length).toBe(0)
    })

    it('should skip invalid date of birth', async () => {
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

      await send(mockFbq, mockClientParamBuilder, payload, defaultSettings, mockAnalytics)

      // Should not call init if only invalid date is provided
      const initCalls = (mockFbq).mock.calls.filter((call) => call[0] === 'init')
      expect(initCalls.length).toBe(0)
    })
  })

  describe('init call limits', () => {
    it('should not send userData init when init count is at max', async () => {
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

      await send(mockFbq, mockClientParamBuilder, payload, defaultSettings, mockAnalytics)

      // Should not call init with user data when count is at max
      const initCalls = (mockFbq).mock.calls.filter((call) => call[0] === 'init')
      expect(initCalls.length).toBe(0)
    })

    it('should only call init twice across multiple track events', async () => {
      // Start with init count at 0
      let currentInitCount = 0
      mockAnalytics.storage.get.mockImplementation((key) => {
        if (key === 'fb_pixel_init_count') {
          return currentInitCount.toString()
        }
        return null
      })
      mockAnalytics.storage.set.mockImplementation((key, value) => {
        if (key === 'fb_pixel_init_count') {
          currentInitCount = parseInt(value, 10)
        }
      })

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

      // First track event - init should be called (count: 0 -> 1)
      await send(mockFbq, mockClientParamBuilder, payload, defaultSettings, mockAnalytics)

      let initCalls = (mockFbq).mock.calls.filter((call) => call[0] === 'init')
      expect(initCalls.length).toBe(1)
      expect(currentInitCount).toBe(1)

      // Second track event - init should be called again (count: 1 -> 2)
      await send(mockFbq, mockClientParamBuilder, payload, defaultSettings, mockAnalytics)

      initCalls = (mockFbq).mock.calls.filter((call) => call[0] === 'init')
      expect(initCalls.length).toBe(2)
      expect(currentInitCount).toBe(2)

      // Third track event - init should NOT be called (count stays at 2)
      await send(mockFbq, mockClientParamBuilder, payload, defaultSettings, mockAnalytics)

      initCalls = (mockFbq).mock.calls.filter((call) => call[0] === 'init')
      expect(initCalls.length).toBe(2) // Still only 2 init calls
      expect(currentInitCount).toBe(2) // Count remains at max

      // Fourth track event - init should still NOT be called
      await send(mockFbq, mockClientParamBuilder, payload, defaultSettings, mockAnalytics)

      initCalls = (mockFbq).mock.calls.filter((call) => call[0] === 'init')
      expect(initCalls.length).toBe(2) // Still only 2 init calls
      expect(currentInitCount).toBe(2)

      // Verify user data storage was still updated on all calls
      const userDataSetCalls = (mockAnalytics.storage.set).mock.calls.filter((call) => call[0] === 'fb_user_data')
      expect(userDataSetCalls.length).toBe(4) // User data stored on all 4 track events
    })
  })
})
