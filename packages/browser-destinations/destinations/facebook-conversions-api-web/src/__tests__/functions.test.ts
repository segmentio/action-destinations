import { initScript, setStorageInitCount, storageFallback } from '../functions'
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
      const settings = {
        pixelId: 'test-pixel-123',
        ldu: LDU.Disabled.key
      }

      initScript(settings, mockAnalytics)

      expect(window.fbq).toBeDefined()
      expect(typeof window.fbq).toBe('function')
    })

    it('should set LDU to disabled when configured', () => {
      const settings = {
        pixelId: 'test-pixel-123',
        ldu: LDU.Disabled.key
      }

      initScript(settings, mockAnalytics)

      expect(window.fbq).toBeDefined()
      expect(mockAnalytics.storage.set).toHaveBeenCalledWith('fb_pixel_init_count', '1')
    })

    it('should set LDU with California state when configured', () => {
      const settings = {
        pixelId: 'test-pixel-123',
        ldu: LDU.California.key
      }

      initScript(settings, mockAnalytics)

      expect(window.fbq).toBeDefined()
      expect(mockAnalytics.storage.set).toHaveBeenCalledWith('fb_pixel_init_count', '1')
    })

    it('should disable push state when configured', () => {
      const settings = {
        pixelId: 'test-pixel-123',
        ldu: LDU.Disabled.key,
        disablePushState: true
      }

      initScript(settings, mockAnalytics)

      expect(window.fbq.disablePushState).toBe(true)
    })

    it('should set init count in storage', () => {
      const settings = {
        pixelId: 'test-pixel-123',
        ldu: LDU.Disabled.key
      }

      initScript(settings, mockAnalytics)

      expect(mockAnalytics.storage.set).toHaveBeenCalledWith('fb_pixel_init_count', '1')
    })

    it('should initialize pixel with stored user data', () => {
      const userData = {
        em: 'test@example.com',
        fn: 'John',
        ln: 'Doe'
      }

      mockAnalytics.storage.get.mockReturnValue(JSON.stringify(userData))

      const settings = {
        pixelId: 'test-pixel-123',
        ldu: LDU.Disabled.key
      }

      initScript(settings, mockAnalytics)

      expect(window.fbq).toBeDefined()
      expect(mockAnalytics.storage.get).toHaveBeenCalledWith('fb_user_data')
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
      Storage.prototype.getItem.mockReturnValue('test-value')

      const value = storageFallback.get('test-key')

      expect(Storage.prototype.getItem).toHaveBeenCalledWith('test-key')
      expect(value).toBe('test-value')
    })

    it('should return null if localStorage throws error', () => {
      Storage.prototype.getItem.mockImplementation(() => {
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
      Storage.prototype.setItem.mockImplementation(() => {
        throw new Error('Storage not available')
      })

      expect(() => {
        storageFallback.set('test-key', 'test-value')
      }).not.toThrow()
    })
  })
})
