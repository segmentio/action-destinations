import {
  validate,
  validateContents,
  isHashedInformation,
  getPurchaseEventData,
  getSearchEventData,
  getViewContentEventData,
  getCustomEventData,
  convertToAppendValueEventData,
  getUserData
} from '../../shared/functions'
import { EventType, FEATURE_FLAG_APPEND_VALUE } from '../../shared/constants'
import { CustomEventData, PurchaseEventData } from '../../shared/types'

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

  describe('convertToAppendValueEventData', () => {
    const baseCustomData: CustomEventData = {
      event_name: 'Purchase',
      event_time: '1631210000',
      action_source: 'website',
      user_data: { em: 'hashed_email' },
      custom_data: {
        order_id: 'order-123',
        net_revenue: 85.0,
        predicted_ltv: 200.0,
        currency: 'USD',
        value: 99.99
      }
    }

    const validAppendDetails = {
      original_event_time: '2021-09-09T16:26:40Z',
      original_event_order_id: 'order-123',
      original_event_id: 'evt-456',
      net_revenue_to_append: 10.5,
      predicted_ltv_to_append: 150.0
    }

    it('should return AppendValueEventData with all fields populated', () => {
      const result = convertToAppendValueEventData(baseCustomData, validAppendDetails)

      expect(result.event_name).toBe('AppendValue')
      expect(result.custom_data).toEqual({
        currency: 'USD',
        value: 99.99,
        net_revenue: 10.5,
        predicted_ltv: 150.0
      })
      expect(result.original_event_data).toEqual({
        event_name: 'Purchase',
        event_time: '2021-09-09T16:26:40Z',
        order_id: 'order-123',
        event_id: 'evt-456'
      })
    })

    it('should return AppendValueEventData with only net_revenue_to_append', () => {
      const details = {
        ...validAppendDetails,
        predicted_ltv_to_append: undefined
      }

      const result = convertToAppendValueEventData(baseCustomData, details as any)

      expect(result.custom_data.net_revenue).toBe(10.5)
      expect(result.custom_data).not.toHaveProperty('predicted_ltv')
    })

    it('should return AppendValueEventData with only predicted_ltv_to_append', () => {
      const details = {
        ...validAppendDetails,
        net_revenue_to_append: undefined
      }

      const result = convertToAppendValueEventData(baseCustomData, details as any)

      expect(result.custom_data.predicted_ltv).toBe(150.0)
      expect(result.custom_data).not.toHaveProperty('net_revenue')
    })

    it('should match using original_event_id only', () => {
      const details = {
        ...validAppendDetails,
        original_event_order_id: undefined
      }

      const result = convertToAppendValueEventData(baseCustomData, details as any)

      expect(result.original_event_data).toEqual({
        event_name: 'Purchase',
        event_time: '2021-09-09T16:26:40Z',
        event_id: 'evt-456'
      })
      expect(result.original_event_data).not.toHaveProperty('order_id')
    })

    it('should match using original_event_order_id only', () => {
      const details = {
        ...validAppendDetails,
        original_event_id: undefined
      }

      const result = convertToAppendValueEventData(baseCustomData, details as any)

      expect(result.original_event_data).toEqual({
        event_name: 'Purchase',
        event_time: '2021-09-09T16:26:40Z',
        order_id: 'order-123'
      })
      expect(result.original_event_data).not.toHaveProperty('event_id')
    })

    it('should strip order_id, net_revenue, and predicted_ltv from custom_data', () => {
      const result = convertToAppendValueEventData(baseCustomData, validAppendDetails)

      expect(result.custom_data).not.toHaveProperty('order_id')
      expect(result.custom_data.net_revenue).toBe(10.5)
      expect(result.custom_data.predicted_ltv).toBe(150.0)
    })

    it('should throw when original_event_time is missing', () => {
      const details = { ...validAppendDetails, original_event_time: undefined }

      expect(() => convertToAppendValueEventData(baseCustomData, details as any)).toThrow(
        'If sending an AppendValue, Append Event Details field "Original Event Time" is required'
      )
    })

    it('should throw when neither original_event_order_id nor original_event_id is provided', () => {
      const details = {
        ...validAppendDetails,
        original_event_order_id: undefined,
        original_event_id: undefined
      }

      expect(() => convertToAppendValueEventData(baseCustomData, details as any)).toThrow(
        'one of "Append Event Details > Original Event ID" or "Append Event Details > Original Order ID" must be provided'
      )
    })

    it('should throw when neither net_revenue_to_append nor predicted_ltv_to_append is a number', () => {
      const details = {
        ...validAppendDetails,
        net_revenue_to_append: undefined,
        predicted_ltv_to_append: undefined
      }

      expect(() => convertToAppendValueEventData(baseCustomData, details as any)).toThrow(
        'at least one of "Append Event Details > Net Revenue" or "Append Event Details > Predicted Lifetime Value" must be provided as a number'
      )
    })

    it('should increment append_value_event.success stat on success', () => {
      const statsClient = { incr: jest.fn() }
      const tags = ['test:tag']
      const statsContext = { statsClient, tags } as any

      convertToAppendValueEventData(baseCustomData, validAppendDetails, statsContext)

      expect(statsClient.incr).toHaveBeenCalledWith('append_value_event.success', 1, tags)
    })

    it('should increment append_value_event.error stat on validation failure', () => {
      const statsClient = { incr: jest.fn() }
      const tags = ['test:tag']
      const statsContext = { statsClient, tags } as any

      const details = { ...validAppendDetails, original_event_time: undefined }

      expect(() => convertToAppendValueEventData(baseCustomData, details as any, statsContext)).toThrow()
      expect(statsClient.incr).toHaveBeenCalledWith('append_value_event.error', 1, tags)
    })
  })

  describe('getCustomEventData', () => {
    const customPayload = {
      ...basePayload,
      event_name: 'LTV Update',
      is_append_event: true,
      append_event_details: {
        original_event_time: '2021-09-09T16:26:40Z',
        original_event_order_id: 'order-123',
        net_revenue_to_append: 10.5
      },
      custom_data: { custom_prop: 'value' }
    } as any

    it('should return AppendValueEventData when flag is ON and is_append_event is true', () => {
      const features = { [FEATURE_FLAG_APPEND_VALUE]: true }

      const result = getCustomEventData(customPayload, features)

      expect(result.event_name).toBe('AppendValue')
      expect((result as any).original_event_data.event_name).toBe('LTV Update')
    })

    it('should throw when is_append_event is true but flag is OFF', () => {
      expect(() => getCustomEventData(customPayload, {})).toThrow(
        'AppendValue is not enabled for this destination'
      )
    })

    it('should return normal CustomEventData when is_append_event is false', () => {
      const payload = { ...customPayload, is_append_event: false }
      const features = { [FEATURE_FLAG_APPEND_VALUE]: true }

      const result = getCustomEventData(payload, features)

      expect(result.event_name).toBe('LTV Update')
      expect(result).not.toHaveProperty('original_event_data')
    })
  })

  describe('getPurchaseEventData - AppendValue', () => {
    const purchasePayload = {
      ...basePayload,
      currency: 'USD',
      value: 99.99,
      is_append_event: true,
      append_event_details: {
        original_event_time: '2021-09-09T16:26:40Z',
        original_event_id: 'evt-789',
        predicted_ltv_to_append: 200.0
      },
      custom_data: { order_id: 'order-abc' }
    } as any

    it('should return AppendValueEventData when flag is ON and is_append_event is true', () => {
      const features = { [FEATURE_FLAG_APPEND_VALUE]: true }

      const result = getPurchaseEventData(purchasePayload, features)

      expect(result.event_name).toBe('AppendValue')
      expect((result as any).original_event_data.event_name).toBe('Purchase')
      expect((result as any).original_event_data.event_id).toBe('evt-789')
    })

    it('should throw when is_append_event is true but flag is OFF', () => {
      expect(() => getPurchaseEventData(purchasePayload, {})).toThrow(
        'AppendValue is not enabled for this destination'
      )
    })

    it('should return normal PurchaseEventData when is_append_event is false', () => {
      const payload = { ...purchasePayload, is_append_event: false }
      const features = { [FEATURE_FLAG_APPEND_VALUE]: true }

      const result = getPurchaseEventData(payload, features)

      expect(result.event_name).toBe('Purchase')
      expect(result).not.toHaveProperty('original_event_data')
    })
  })

  describe('getUserData', () => {
    it('should trim whitespace from string fields', () => {
      const userData = {
        email: 'test@test.com',
        client_ip_address: '  192.168.1.1  ',
        client_user_agent: '  Mozilla/5.0  ',
        fbc: '  fb.1.123  ',
        fbp: '  fb.1.456  ',
        subscriptionID: '  sub-123  ',
        anonId: '  anon-456  ',
        madId: '  mad-789  ',
        partner_id: '  partner-1  ',
        partner_name: '  Meta  ',
        ctwa_clid: '  click-id-123  '
      }

      const result = getUserData(userData)

      expect(result.client_ip_address).toBe('192.168.1.1')
      expect(result.client_user_agent).toBe('Mozilla/5.0')
      expect(result.fbc).toBe('fb.1.123')
      expect(result.fbp).toBe('fb.1.456')
      expect(result.subscription_id).toBe('sub-123')
      expect(result.anon_id).toBe('anon-456')
      expect(result.madid).toBe('mad-789')
      expect(result.partner_id).toBe('partner-1')
      expect(result.partner_name).toBe('Meta')
      expect(result.ctwa_clid).toBe('click-id-123')
    })

    it('should exclude fields that are empty strings', () => {
      const userData = {
        email: 'test@test.com',
        client_ip_address: '',
        fbc: '',
        ctwa_clid: ''
      }

      const result = getUserData(userData)

      expect(result).not.toHaveProperty('client_ip_address')
      expect(result).not.toHaveProperty('fbc')
      expect(result).not.toHaveProperty('ctwa_clid')
    })

    it('should exclude fields that are whitespace-only strings', () => {
      const userData = {
        email: 'test@test.com',
        client_ip_address: '   ',
        fbc: ' \t ',
        ctwa_clid: '  '
      }

      const result = getUserData(userData)

      expect(result).not.toHaveProperty('client_ip_address')
      expect(result).not.toHaveProperty('fbc')
      expect(result).not.toHaveProperty('ctwa_clid')
    })

    it('should include ctwa_clid when it is a valid non-empty string', () => {
      const userData = {
        email: 'test@test.com',
        ctwa_clid: 'valid-click-id'
      }

      const result = getUserData(userData)

      expect(result.ctwa_clid).toBe('valid-click-id')
    })

    it('should preserve numeric fields without trimming', () => {
      const userData = {
        email: 'test@test.com',
        leadID: 12345,
        fbLoginID: 67890
      }

      const result = getUserData(userData)

      expect(result.lead_id).toBe(12345)
      expect(result.fb_login_id).toBe(67890)
    })
  })
})
