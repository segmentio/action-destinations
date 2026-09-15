import destination from '../index'

describe('AppsFlyer', () => {
  it('exposes the three actions the classic destination supported', () => {
    expect(Object.keys(destination.actions).sort()).toEqual(['applicationInstalled', 'applicationOpened', 'trackEvent'])
  })

  it('is a cloud-mode destination', () => {
    expect(destination.mode).toBe('cloud')
    expect(destination.slug).toBe('actions-appsflyer')
  })

  it('requires the S2S token and leaves the dev key optional', () => {
    const fields = destination.authentication?.fields
    expect(fields?.s2sToken.required).toBe(true)
    expect(fields?.s2sToken.type).toBe('password')
    // Only the server-to-server install/open actions need the dev key.
    expect(fields?.devKey.required).toBe(false)
  })

  it('does not define testAuthentication', () => {
    // AppsFlyer has no validation endpoint, so there is nothing to call.
    expect(destination.authentication?.testAuthentication).toBeUndefined()
  })
})
