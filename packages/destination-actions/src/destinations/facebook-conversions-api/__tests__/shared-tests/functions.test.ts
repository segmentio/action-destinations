import { validate, validateContents, isHashedInformation } from '../../shared/functions'
import { EventType } from '../../shared/constants'

describe('FacebookConversionsApi', () => {
  describe('validate', () => {
    it('should throw when user_data is missing', () => {
      const payload = {
        action_source: 'website',
        event_time: '1631210000'
      } as any

      expect(() => validate(payload, EventType.Purchase)).toThrow('Must include at least one user data property')
    })

    it('should throw when action_source is website but client_user_agent is missing', () => {
      const payload = {
        action_source: 'website',
        event_time: '1631210000',
        currency: 'USD',
        user_data: {
          email: 'test@test.com'
        }
      } as any

      expect(() => validate(payload, EventType.Purchase)).toThrow(
        'If action source is "Website" then client_user_agent must be defined'
      )
    })

    it('should throw for an invalid currency code', () => {
      const payload = {
        action_source: 'email',
        event_time: '1631210000',
        currency: 'FAKE',
        user_data: {
          email: 'test@test.com'
        }
      } as any

      expect(() => validate(payload, EventType.AddToCart)).toThrow('FAKE is not a valid currency code.')
    })

    it('should not throw for a valid payload', () => {
      const payload = {
        action_source: 'website',
        event_time: '1631210000',
        currency: 'USD',
        user_data: {
          email: 'test@test.com',
          client_user_agent: 'Mozilla/5.0'
        }
      } as any

      expect(() => validate(payload, EventType.Purchase)).not.toThrow()
    })
  })

  describe('validateContents', () => {
    it('should throw when a content item is missing an id', () => {
      const contents = [{ quantity: 1, item_price: 10 }] as any

      expect(() => validateContents(contents)).toThrow("contents[0] must include an 'id' parameter.")
    })

    it('should throw for an invalid delivery_category', () => {
      const contents = [{ id: 'product-1', delivery_category: 'drone' }] as any

      expect(() => validateContents(contents)).toThrow(
        'contents[0].delivery_category must be one of {in_store, home_delivery, curbside}.'
      )
    })
  })

  describe('isHashedInformation', () => {
    it('should return true for a valid SHA256 hash', () => {
      // SHA256 of "test"
      const hashed = '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08'
      expect(isHashedInformation(hashed)).toBe(true)
    })

    it('should return false for plaintext values', () => {
      expect(isHashedInformation('test@example.com')).toBe(false)
      expect(isHashedInformation('+15105550011')).toBe(false)
    })
  })
})
