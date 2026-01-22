import { Analytics } from '@segment/analytics-next'
import { initScript, setStorageInitCount, storageFallback } from '../functions'
import { Settings } from '../generated-types'
import { LDU } from '../types'

describe('Facebook Conversions API Web - Main Functions', () => {
  let mockFbq
  let mockAnalytics

  beforeEach(() => {
    // Reset window.fbq
    delete window.fbq
    delete window._fbq

    mockFbq = jest.fn()
    mockAnalytics = {
      storage: {
        get: jest.fn(),
        set: jest.fn()
      }
    }

    // Mock localStorage
    Storage.prototype.getItem = jest.fn()
    Storage.prototype.setItem = jest.fn()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('initScript', () => {
    it('should initialize Facebook Pixel with basic settings', () => {
      const settings: Settings = {
        pixelId: 'test-pixel-123',
        ldu: LDU.Disabled.key
      }

      initScript(settings, mockAnalytics)

      expect(window.fbq).toBeDefined()
      expect(typeof window.fbq).toBe('function')
    })

    it('should set LDU to disabled when configured', () => {
      const settings: Settings = {
        pixelId: 'test-pixel-123',
        ldu: LDU.Disabled.key
      }

      initScript(settings, mockAnalytics)

      expect(window.fbq).toHaveBeenCalledWith('dataProcessingOptions', [])
    })

    it('should set LDU with California state when configured', () => {
      const settings: Settings = {
        pixelId: 'test-pixel-123',
        ldu: LDU.California.key
      }

      initScript(settings, mockAnalytics)

      expect(window.fbq).toHaveBeenCalledWith('dataProcessingOptions', ['LDU'], 1, 1000)
    })

    it('should disable push state when configured', () => {
      const settings: Settings = {
        pixelId: 'test-pixel-123',
        ldu: LDU.Disabled.key,
        disablePushState: true
      }

      initScript(settings, mockAnalytics)

      expect(window.fbq.disablePushState).toBe(true)
    })

    it('should disable auto config when configured', () => {
      const settings: Settings = {
        pixelId: 'test-pixel-123',
        ldu: LDU.Disabled.key,
        disableAutoConfig: true
      }

      initScript(settings, mockAnalytics)

      expect(window.fbq).toHaveBeenCalledWith('set', 'autoConfig', false, 'test-pixel-123')
    })

    it('should disable first party cookies when configured', () => {
      const settings: Settings = {
        pixelId: 'test-pixel-123',
        ldu: LDU.Disabled.key,
        disableFirstPartyCookies: true
      }

      initScript(settings, mockAnalytics)

      expect(window.fbq).toHaveBeenCalledWith('set', 'firstPartyCookies', false, 'test-pixel-123')
    })

    it('should initialize pixel with agent when provided', () => {
      const settings: Settings = {
        pixelId: 'test-pixel-123',
        ldu: LDU.Disabled.key,
        agent: 'custom-agent'
      }

      initScript(settings, mockAnalytics)

      expect(window.fbq).toHaveBeenCalledWith('init', 'test-pixel-123', undefined, { agent: 'custom-agent' })
    })

    it('should initialize pixel with stored user data', () => {
      const userData = {
        em: 'test@example.com',
        fn: 'John',
        ln: 'Doe'
      }

      ;(mockAnalytics.storage.get as jest.Mock).mockReturnValue(JSON.stringify(userData))

      const settings: Settings = {
        pixelId: 'test-pixel-123',
        ldu: LDU.Disabled.key
      }

      initScript(settings, mockAnalytics)

      expect(window.fbq).toHaveBeenCalledWith('init', 'test-pixel-123', userData)
    })

    it('should send PageView when push state is not disabled', () => {
      const settings: Settings = {
        pixelId: 'test-pixel-123',
        ldu: LDU.Disabled.key,
        disablePushState: false
      }

      initScript(settings, mockAnalytics)

      expect(window.fbq).toHaveBeenCalledWith('trackSingle', 'test-pixel-123', 'PageView')
    })

    it('should not send PageView when push state is disabled', () => {
      const settings: Settings = {
        pixelId: 'test-pixel-123',
        ldu: LDU.Disabled.key,
        disablePushState: true
      }

      initScript(settings, mockAnalytics)

      const calls = (window.fbq as jest.Mock).mock.calls
      const pageViewCall = calls.find((call) => call[0] === 'trackSingle' && call[2] === 'PageView')
      expect(pageViewCall).toBeUndefined()
    })
  })

  describe('setStorageInitCount', () => {
    it('should set init count in storage', () => {
      setStorageInitCount(mockAnalytics, 1)

      expect(mockAnalytics.storage.set).toHaveBeenCalledWith('fb_pixel_init_count', '1')
    })

    it('should set init count to 2', () => {
      setStorageInitCount(mockAnalytics, 2)

      expect(mockAnalytics.storage.set).toHaveBeenCalledWith('fb_pixel_init_count', '2')
    })
  })

  describe('storageFallback', () => {
    it('should get value from localStorage', () => {
      ;(Storage.prototype.getItem as jest.Mock).mockReturnValue('test-value')

      const value = storageFallback.get('test-key')

      expect(Storage.prototype.getItem).toHaveBeenCalledWith('test-key')
      expect(value).toBe('test-value')
    })

    it('should return null if localStorage throws error', () => {
      ;(Storage.prototype.getItem as jest.Mock).mockImplementation(() => {
        throw new Error('Storage not available')
      })

      const value = storageFallback.get('test-key')

      expect(value).toBeNull()
    })

    it('should set value in localStorage', () => {
      storageFallback.set('test-key', 'test-value')

      expect(Storage.prototype.setItem).toHaveBeenCalledWith('test-key', 'test-value')
    })

    it('should silently fail if localStorage.setItem throws error', () => {
      ;(Storage.prototype.setItem as jest.Mock).mockImplementation(() => {
        throw new Error('Storage not available')
      })

      expect(() => {
        storageFallback.set('test-key', 'test-value')
      }).not.toThrow()
    })
  })
})
