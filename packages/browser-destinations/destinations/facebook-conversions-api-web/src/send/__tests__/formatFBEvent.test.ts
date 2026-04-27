import { formatFBEvent } from '../functions'
import { Payload } from '../generated-types'

describe('formatFBEvent', () => {
  it('should format a complete Purchase event with all fields', () => {
    const payload: Partial<Payload> = {
      event_config: {
        event_name: 'Purchase',
        show_fields: true
      },
      content_ids: ['product-123', 'product-456'],
      content_name: 'Test Product',
      content_category: 'Electronics',
      content_type: 'product',
      contents: [
        { id: 'product-123', quantity: 2, item_price: 49.99 },
        { id: 'product-456', quantity: 1, item_price: 99.99 }
      ],
      currency: 'USD',
      delivery_category: 'home_delivery',
      num_items: 3,
      value: 199.97,
      predicted_ltv: 500.0,
      net_revenue: 180.0,
      custom_data: {
        order_id: 'order-123',
        campaign_id: 'summer-sale'
      }
    }

    const result = formatFBEvent(payload as Payload)

    expect(result).toEqual({
      partner_agent: 'segment',
      content_ids: ['product-123', 'product-456'],
      content_name: 'Test Product',
      content_category: 'Electronics',
      content_type: 'product',
      contents: [
        { id: 'product-123', quantity: 2, item_price: 49.99 },
        { id: 'product-456', quantity: 1, item_price: 99.99 }
      ],
      currency: 'USD',
      delivery_category: 'home_delivery',
      num_items: 3,
      value: 199.97,
      predicted_ltv: 500.0,
      net_revenue: 180.0,
      custom_data: {
        order_id: 'order-123',
        campaign_id: 'summer-sale'
      }
    })
  })

  it('should format minimal PageView event', () => {
    const payload: Partial<Payload> = {
      event_config: {
        event_name: 'PageView',
        show_fields: false
      }
    }

    const result = formatFBEvent(payload as Payload)

    expect(result).toEqual({
      partner_agent: 'segment'
    })
  })

  it('should include only provided fields', () => {
    const payload: Partial<Payload> = {
      event_config: {
        event_name: 'ViewContent',
        show_fields: true
      },
      content_ids: ['product-789'],
      value: 149.99,
      currency: 'USD'
    }

    const result = formatFBEvent(payload as Payload)

    expect(result).toEqual({
      partner_agent: 'segment',
      content_ids: ['product-789'],
      value: 149.99,
      currency: 'USD'
    })
  })

  it('should handle zero values for numeric fields', () => {
    const payload: Partial<Payload> = {
      event_config: {
        event_name: 'Purchase',
        show_fields: true
      },
      content_ids: ['product-123'],
      value: 0,
      num_items: 0,
      predicted_ltv: 0,
      net_revenue: 0
    }

    const result = formatFBEvent(payload as Payload)

    expect(result).toEqual({
      partner_agent: 'segment',
      content_ids: ['product-123'],
      value: 0,
      num_items: 0,
      predicted_ltv: 0,
      net_revenue: 0
    })
  })

  it('should not include empty arrays', () => {
    const payload: Partial<Payload> = {
      event_config: {
        event_name: 'AddToCart',
        show_fields: true
      },
      content_ids: [],
      contents: [],
      value: 99.99
    }

    const result = formatFBEvent(payload as Payload)

    expect(result).toEqual({
      partner_agent: 'segment',
      value: 99.99
    })
  })

  it('should not include empty custom_data object', () => {
    const payload: Partial<Payload> = {
      event_config: {
        event_name: 'Purchase',
        show_fields: true
      },
      content_ids: ['product-123'],
      value: 99.99,
      custom_data: {}
    }

    const result = formatFBEvent(payload as Payload)

    expect(result).toEqual({
      partner_agent: 'segment',
      content_ids: ['product-123'],
      value: 99.99
    })
  })

  it('should include contents array with all item properties', () => {
    const payload: Partial<Payload> = {
      event_config: {
        event_name: 'Purchase',
        show_fields: true
      },
      contents: [
        { id: 'product-1', quantity: 2, item_price: 25.50 },
        { id: 'product-2', quantity: 1, item_price: 100.00 },
        { id: 'product-3', quantity: 3 }
      ],
      value: 151.00
    }

    const result = formatFBEvent(payload as Payload)

    expect(result).toEqual({
      partner_agent: 'segment',
      contents: [
        { id: 'product-1', quantity: 2, item_price: 25.50 },
        { id: 'product-2', quantity: 1, item_price: 100.00 },
        { id: 'product-3', quantity: 3 }
      ],
      value: 151.00
    })
  })

  it('should include all standard event fields', () => {
    const payload: Partial<Payload> = {
      event_config: {
        event_name: 'InitiateCheckout',
        show_fields: true
      },
      content_category: 'Apparel',
      content_ids: ['shirt-123'],
      content_name: 'Blue Shirt',
      content_type: 'product',
      currency: 'EUR',
      num_items: 2,
      value: 59.98
    }

    const result = formatFBEvent(payload as Payload)

    expect(result).toEqual({
      partner_agent: 'segment',
      content_category: 'Apparel',
      content_ids: ['shirt-123'],
      content_name: 'Blue Shirt',
      content_type: 'product',
      currency: 'EUR',
      num_items: 2,
      value: 59.98
    })
  })

  it('should format Subscribe event with predicted_ltv', () => {
    const payload: Partial<Payload> = {
      event_config: {
        event_name: 'Subscribe',
        show_fields: true
      },
      value: 9.99,
      currency: 'USD',
      predicted_ltv: 119.88
    }

    const result = formatFBEvent(payload as Payload)

    expect(result).toEqual({
      partner_agent: 'segment',
      value: 9.99,
      currency: 'USD',
      predicted_ltv: 119.88
    })
  })

  it('should format Purchase event with net_revenue', () => {
    const payload: Partial<Payload> = {
      event_config: {
        event_name: 'Purchase',
        show_fields: true
      },
      content_ids: ['product-123'],
      value: 100.00,
      currency: 'USD',
      net_revenue: 85.00
    }

    const result = formatFBEvent(payload as Payload)

    expect(result).toEqual({
      partner_agent: 'segment',
      content_ids: ['product-123'],
      value: 100.00,
      currency: 'USD',
      net_revenue: 85.00
    })
  })

  it('should include custom_data when provided', () => {
    const payload: Partial<Payload> = {
      event_config: {
        event_name: 'Lead',
        show_fields: true
      },
      value: 0,
      custom_data: {
        lead_source: 'facebook_ad',
        lead_type: 'newsletter_signup',
        campaign_name: 'Q1-2024'
      }
    }

    const result = formatFBEvent(payload as Payload)

    expect(result).toEqual({
      partner_agent: 'segment',
      value: 0,
      custom_data: {
        lead_source: 'facebook_ad',
        lead_type: 'newsletter_signup',
        campaign_name: 'Q1-2024'
      }
    })
  })
})
