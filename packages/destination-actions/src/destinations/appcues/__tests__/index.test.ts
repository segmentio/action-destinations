import Destination from '../index'

describe('Appcues (Actions)', () => {
  it('should be a valid destination', () => {
    expect(Destination.name).toBe('Appcues (Actions)')
    expect(Destination.slug).toBe('actions-appcues')
    expect(Destination.mode).toBe('cloud')
    expect(Destination.actions.send).toBeDefined()
  })

  it('should have correct authentication fields', () => {
    expect(Destination.authentication.scheme).toBe('custom')
    expect(Destination.authentication.fields.apiKey).toBeDefined()
    expect(Destination.authentication.fields.region).toBeDefined()
  })
})
