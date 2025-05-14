// Simple test scaffolding for TrackConversion action
import Destination from '../../index'

describe('AmazonConversionsApi.trackConversion', () => {
  it('should have all the required properties', () => {
    const action = Destination.actions.trackConversion
    
    expect(action).toBeDefined()
    expect(action.title).toBe('Track Conversion')
    expect(action.description).toContain('Send conversion event data to Amazon Events API')
    expect(typeof action.perform).toBe('function')
    expect(action.defaultSubscription).toBe('type = "track"')
    
    // Verify fields are defined
    expect(action.fields).toHaveProperty('name')
    expect(action.fields).toHaveProperty('eventType')
    expect(action.fields).toHaveProperty('eventActionSource')
    expect(action.fields).toHaveProperty('countryCode')
    
    // Verify match key fields
    expect(action.fields).toHaveProperty('email')
    expect(action.fields).toHaveProperty('phone')
    expect(action.fields).toHaveProperty('firstName')
    expect(action.fields).toHaveProperty('lastName')
    expect(action.fields).toHaveProperty('address')
    expect(action.fields).toHaveProperty('city')
    expect(action.fields).toHaveProperty('state')
    expect(action.fields).toHaveProperty('postalCode')
    expect(action.fields).toHaveProperty('maid')
    expect(action.fields).toHaveProperty('rampId')
    expect(action.fields).toHaveProperty('matchId')
  })
})
