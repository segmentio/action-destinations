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
    expect(Destination.authentication.fields.apiSecret).toBeDefined()
    expect(Destination.authentication.fields.region).toBeDefined()
    expect(Destination.authentication.fields.accountId).toBeDefined()
  })

  it('should correctly set Basic auth header in extendRequest', () => {
    const settings = {
      apiKey: 'test-api-key',
      apiSecret: 'test-api-secret',
      accountId: 'test-account-id',
      region: 'US'
    }

    const result = Destination.extendRequest?.({ settings })

    const expectedAuth = `Basic ${Buffer.from('test-api-key:test-api-secret').toString('base64')}`

    expect(result).toBeDefined()
    expect(result?.headers).toBeDefined()
    expect(result?.headers?.Authorization).toBe(expectedAuth)
    expect(result?.headers?.['Content-Type']).toBe('application/json')
  })
})
