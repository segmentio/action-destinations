import { destination } from '../index'
import type { Settings } from '../generated-types'
describe('Set Configuration Fields action', () => {
  const defaultSettings: Settings = {
    enableConsentMode: false,
    measurementID: 'G-XXXXXXXXXX',
    allowAdPersonalizationSignals: false,
    allowGoogleSignals: false,
    cookieDomain: 'auto',
    cookieExpirationInSeconds: 63072000,
    cookieUpdate: true,
    pageView: true
  }
  beforeEach(async () => {
    jest.restoreAllMocks()
  })

  it('should load script from default domain when no domain setting is provided', async () => {
    const mockLoadScript = jest.fn().mockResolvedValue(undefined)
    const mockDeps = { loadScript: mockLoadScript }
    await destination.initialize({ settings: { ...defaultSettings } }, mockDeps)
    expect(mockLoadScript).toHaveBeenCalledWith('https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX')
  })

  it('should load script from custom domain when domain setting is provided', async () => {
    const mockLoadScript = jest.fn().mockResolvedValue(undefined)
    const mockDeps = { loadScript: mockLoadScript }
    await destination.initialize({ settings: { ...defaultSettings, domain: 'www.example.com' } }, mockDeps)
    expect(mockLoadScript).toHaveBeenCalledWith('https://www.example.com/gtag/js?id=G-XXXXXXXXXX')
  })
})
