import {
  validate,
  validateContents,
  isHashedInformation,
  getPurchaseEventData,
  getSearchEventData,
  getViewContentEventData
} from '../../shared/functions'
import { EventType } from '../../shared/constants'

const basePayload = {
  event_time: '1631210000',
  action_source: 'website',
  user_data: {
    email: 'test@test.com',
    client_user_agent: 'Mozilla/5.0'
  }
}

describe('FacebookConversionsApi', () => {
  describe('validate', () => {
    it('should throw when user_data is missing', () => {
      const payload = {
        action_source: 'website',
        event_time: '1631210000'
      } as any

      expect(() => validate(payload, EventType.AddToCart)).toThrow('Must include at least one user data property')
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

  describe('getPurchaseEventData', () => {
    it('should return Purchase event data with all optional fields', () => {
      const payload = {
        ...basePayload,
        currency: 'USD',
        value: 99.99,
        net_revenue: 85.0,
        content_ids: ['ABC123', 'XYZ789'],
        content_name: 'Shoes',
        content_type: 'product',
        num_items: 2,
        contents: [
          { id: 'ABC123', quantity: 2 },
          { id: 'XYZ789', quantity: 3 }
        ],
        custom_data: { order_id: 'order-1' }
      } as any

      const result = getPurchaseEventData(payload)

      expect(result.event_name).toBe('Purchase')
      expect(result.event_time).toBe('1631210000')
      expect(result.action_source).toBe('website')
      expect(result.custom_data).toEqual({
        order_id: 'order-1',
        currency: 'USD',
        value: 99.99,
        net_revenue: 85.0,
        content_ids: ['ABC123', 'XYZ789'],
        content_name: 'Shoes',
        content_type: 'product',
        contents: [
          { id: 'ABC123', quantity: 2 },
          { id: 'XYZ789', quantity: 3 }
        ],
        num_items: 2
      })
    })

    it('should omit optional fields when not provided', () => {
      const payload = {
        ...basePayload,
        currency: 'EUR',
        value: 50.0
      } as any

      const result = getPurchaseEventData(payload)

      expect(result.event_name).toBe('Purchase')
      expect(result.custom_data).toEqual({
        currency: 'EUR',
        value: 50.0
      })
      expect(result.custom_data).not.toHaveProperty('net_revenue')
      expect(result.custom_data).not.toHaveProperty('content_ids')
      expect(result.custom_data).not.toHaveProperty('content_name')
      expect(result.custom_data).not.toHaveProperty('content_type')
      expect(result.custom_data).not.toHaveProperty('contents')
      expect(result.custom_data).not.toHaveProperty('num_items')
    })

    it('should include net_revenue when it is 0', () => {
      const payload = {
        ...basePayload,
        currency: 'USD',
        value: 10.0,
        net_revenue: 0
      } as any

      const result = getPurchaseEventData(payload)

      expect(result.custom_data.net_revenue).toBe(0)
    })

    it('should include num_items when it is 0', () => {
      const payload = {
        ...basePayload,
        currency: 'USD',
        value: 10.0,
        num_items: 0
      } as any

      const result = getPurchaseEventData(payload)

      expect(result.custom_data.num_items).toBe(0)
    })

    it('should omit content_ids when the array is empty', () => {
      const payload = {
        ...basePayload,
        currency: 'USD',
        value: 10.0,
        content_ids: []
      } as any

      const result = getPurchaseEventData(payload)

      expect(result.custom_data).not.toHaveProperty('content_ids')
    })
  })

  describe('getSearchEventData', () => {
    it('should return Search event data with all optional fields', () => {
      const payload = {
        ...basePayload,
        currency: 'USD',
        value: 25.0,
        content_ids: ['SKU-1', 'SKU-2'],
        search_string: 'running shoes',
        content_category: 'footwear',
        contents: [{ id: 'SKU-1', quantity: 1 }],
        custom_data: { source: 'search_bar' }
      } as any

      const result = getSearchEventData(payload)

      expect(result.event_name).toBe('Search')
      expect(result.event_time).toBe('1631210000')
      expect(result.action_source).toBe('website')
      expect(result.custom_data).toEqual({
        source: 'search_bar',
        currency: 'USD',
        value: 25.0,
        content_ids: ['SKU-1', 'SKU-2'],
        contents: [{ id: 'SKU-1', quantity: 1 }],
        content_category: 'footwear',
        search_string: 'running shoes'
      })
    })

    it('should omit optional fields when not provided', () => {
      const payload = {
        ...basePayload,
        currency: 'GBP',
        value: 10.0
      } as any

      const result = getSearchEventData(payload)

      expect(result.event_name).toBe('Search')
      expect(result.custom_data).toEqual({
        currency: 'GBP',
        value: 10.0
      })
      expect(result.custom_data).not.toHaveProperty('content_ids')
      expect(result.custom_data).not.toHaveProperty('contents')
      expect(result.custom_data).not.toHaveProperty('content_category')
      expect(result.custom_data).not.toHaveProperty('search_string')
    })

    it('should omit content_ids when the array is empty', () => {
      const payload = {
        ...basePayload,
        currency: 'USD',
        content_ids: []
      } as any

      const result = getSearchEventData(payload)

      expect(result.custom_data).not.toHaveProperty('content_ids')
    })

    it('should omit search_string when it is an empty string', () => {
      const payload = {
        ...basePayload,
        currency: 'USD',
        search_string: ''
      } as any

      const result = getSearchEventData(payload)

      expect(result.custom_data).not.toHaveProperty('search_string')
    })
  })

  describe('getViewContentEventData', () => {
    it('should return ViewContent event data with all optional fields', () => {
      const payload = {
        ...basePayload,
        currency: 'USD',
        value: 149.99,
        content_ids: ['PROD-1'],
        content_name: 'Blue Sneakers',
        content_type: 'product',
        content_category: 'shoes',
        contents: [{ id: 'PROD-1', quantity: 1, item_price: 149.99 }],
        custom_data: { color: 'blue' }
      } as any

      const result = getViewContentEventData(payload)

      expect(result.event_name).toBe('ViewContent')
      expect(result.event_time).toBe('1631210000')
      expect(result.action_source).toBe('website')
      expect(result.custom_data).toEqual({
        color: 'blue',
        currency: 'USD',
        value: 149.99,
        content_ids: ['PROD-1'],
        content_name: 'Blue Sneakers',
        content_type: 'product',
        contents: [{ id: 'PROD-1', quantity: 1, item_price: 149.99 }],
        content_category: 'shoes'
      })
    })

    it('should omit optional fields when not provided', () => {
      const payload = {
        ...basePayload,
        currency: 'JPY',
        value: 5000
      } as any

      const result = getViewContentEventData(payload)

      expect(result.event_name).toBe('ViewContent')
      expect(result.custom_data).toEqual({
        currency: 'JPY',
        value: 5000
      })
      expect(result.custom_data).not.toHaveProperty('content_ids')
      expect(result.custom_data).not.toHaveProperty('content_name')
      expect(result.custom_data).not.toHaveProperty('content_type')
      expect(result.custom_data).not.toHaveProperty('contents')
      expect(result.custom_data).not.toHaveProperty('content_category')
    })

    it('should omit content_ids when the array is empty', () => {
      const payload = {
        ...basePayload,
        currency: 'USD',
        content_ids: []
      } as any

      const result = getViewContentEventData(payload)

      expect(result.custom_data).not.toHaveProperty('content_ids')
    })

    it('should omit content_name when it is an empty string', () => {
      const payload = {
        ...basePayload,
        currency: 'USD',
        content_name: ''
      } as any

      const result = getViewContentEventData(payload)

      expect(result.custom_data).not.toHaveProperty('content_name')
    })

    it('should include event_source_url and event_id from base data when provided', () => {
      const payload = {
        ...basePayload,
        currency: 'USD',
        value: 10.0,
        event_source_url: 'https://example.com/product/123',
        event_id: 'evt-abc-123'
      } as any

      const result = getViewContentEventData(payload)

      expect(result.event_source_url).toBe('https://example.com/product/123')
      expect(result.event_id).toBe('evt-abc-123')
    })
  })
})
