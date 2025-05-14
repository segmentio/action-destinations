// Basic test to confirm destination structure
import Destination from '../index'

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
})
