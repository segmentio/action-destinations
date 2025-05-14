// Basic test to confirm destination structure
import Destination from '../index'
import type { DestinationDefinition } from '@segment/actions-core'

describe('Amazon Conversions API Destination', () => {
  it('should be properly configured', () => {
    // Test destination structure
    expect(Destination).toHaveProperty('name', 'Amazon Conversions Api')
    expect(Destination).toHaveProperty('slug', 'amazon-conversions-api')
    expect(Destination).toHaveProperty('mode', 'cloud')
    
    // Test authentication exists
    expect(Destination).toHaveProperty('authentication')
    expect(Destination.authentication).toHaveProperty('scheme', 'oauth2')
    
    // Test actions exist
    expect(Destination).toHaveProperty('actions')
    expect(Destination.actions).toHaveProperty('trackConversion')
  })
  
  it('should have trackConversion action', () => {
    expect(typeof Destination.actions.trackConversion).toBe('object')
    expect(Destination.actions.trackConversion).toHaveProperty('title', 'Track Conversion')
    expect(Destination.actions.trackConversion).toHaveProperty('perform')
    expect(typeof Destination.actions.trackConversion.perform).toBe('function')
  })

  describe('Presets', () => {
    it('should have presets defined', () => {
      expect(Destination).toHaveProperty('presets')
      const presets = (Destination as DestinationDefinition<any>).presets
      expect(Array.isArray(presets)).toBe(true)
      expect(presets?.length).toBeGreaterThan(0)
    })

    it('should have properly configured presets', () => {
      // Get presets from destination
      const presets = (Destination as DestinationDefinition<any>).presets || []
      
      // Check some key presets exist
      const addToCartPreset = presets.find(p => p.name === 'Add to Shopping Cart')
      const pageViewPreset = presets.find(p => p.name === 'Page View')
      const signUpPreset = presets.find(p => p.name === 'Sign Up')
      
      expect(addToCartPreset).toBeDefined()
      expect(pageViewPreset).toBeDefined()
      expect(signUpPreset).toBeDefined()
      
      // Check preset configurations
      expect(addToCartPreset?.partnerAction).toBe('trackConversion')
      expect(addToCartPreset?.mapping?.eventType).toBe('ADD_TO_SHOPPING_CART')
      expect((addToCartPreset as any)?.subscribe).toBe('type = "track" AND event = "Product Added"')
      
      expect(pageViewPreset?.partnerAction).toBe('trackConversion')
      expect(pageViewPreset?.mapping?.eventType).toBe('PAGE_VIEW')
      expect((pageViewPreset as any)?.subscribe).toBe('type = "page"')
      
      expect(signUpPreset?.partnerAction).toBe('trackConversion')
      expect(signUpPreset?.mapping?.eventType).toBe('SIGN_UP')
      expect((signUpPreset as any)?.subscribe).toBe('type = "track" AND event = "Signed Up"')
    })

    it('should have presets for all supported event types', () => {
      const presets = (Destination as DestinationDefinition<any>).presets || []
      
      // Get all event types from the presets
      const presetEventTypes = presets.map(p => p.mapping?.eventType)
      
      // Check that all expected Amazon event types are covered
      expect(presetEventTypes).toContain('ADD_TO_SHOPPING_CART')
      expect(presetEventTypes).toContain('APPLICATION')
      expect(presetEventTypes).toContain('CHECKOUT')
      expect(presetEventTypes).toContain('CONTACT')
      expect(presetEventTypes).toContain('LEAD')
      expect(presetEventTypes).toContain('OFF_AMAZON_PURCHASES')
      expect(presetEventTypes).toContain('MOBILE_APP_FIRST_START')
      expect(presetEventTypes).toContain('PAGE_VIEW')
      expect(presetEventTypes).toContain('SEARCH')
      expect(presetEventTypes).toContain('SIGN_UP')
      expect(presetEventTypes).toContain('SUBSCRIBE')
      expect(presetEventTypes).toContain('OTHER')
    })

    it('should map Segment events to the correct Amazon event types', () => {
      const presets = (Destination as DestinationDefinition<any>).presets || []
      
      const eventMapping = {
        'Product Added': 'ADD_TO_SHOPPING_CART',
        'Application': 'APPLICATION',
        'Checkout': 'CHECKOUT',
        'Callback Started': 'CONTACT',
        'Generate Lead': 'LEAD',
        'Off Amazon Purchases': 'OFF_AMAZON_PURCHASES',
        'Mobile App First Start': 'MOBILE_APP_FIRST_START',
        'page': 'PAGE_VIEW',  // For type="page"
        'Products Searched': 'SEARCH',
        'Signed Up': 'SIGN_UP',
        'Subscription Created': 'SUBSCRIBE',
        'Other': 'OTHER'
      }

      // Check each mapping has a preset
      for (const [segmentEvent, amazonEvent] of Object.entries(eventMapping)) {
        let preset
        
        if (segmentEvent === 'page') {
          // Special case for page type
          preset = presets.find(p => (p as any)?.subscribe === 'type = "page"')
        } else {
          preset = presets.find(p => (p as any)?.subscribe?.includes(`event = "${segmentEvent}"`))
        }
        
        expect(preset).toBeDefined()
        expect(preset?.mapping?.eventType).toBe(amazonEvent)
      }
    })
  })
})
