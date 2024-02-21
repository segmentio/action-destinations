import googleAnalytics4Web, { destination } from '../index'
import { Analytics, Context } from '@segment/analytics-next'
import { Subscription } from '@segment/browser-destination-runtime/types'

let mockGtag: GA
let setConfigurationEvent: any
const subscriptions: Subscription[] = [
  {
    partnerAction: 'setConfigurationFields',
    name: 'Set Configuration Fields',
    enabled: true,
    subscribe: 'type = "page"',
    mapping: {
      ads_storage_consent_state: {
        '@path': '$.properties.ads_storage_consent_state'
      },
      analytics_storage_consent_state: {
        '@path': '$.properties.analytics_storage_consent_state'
      },
      screen_resolution: {
        '@path': '$.properties.screen_resolution'
      },
      user_id: {
        '@path': '$.properties.user_id'
      },
      page_title: {
        '@path': '$.properties.page_title'
      },
      page_referrer: {
        '@path': '$.properties.page_referrer'
      },
      language: {
        '@path': '$.properties.language'
      },
      content_group: {
        '@path': '$.properties.content_group'
      }
    }
  }
]

describe('Set Configuration Fields action', () => {
  const settings: {
    cookiePrefix?: undefined | string
    enableConsentMode: boolean
    measurementID: string
    allowAdPersonalizationSignals: boolean
    allowGoogleSignals: boolean
    cookieDomain: string
    cookieExpirationInSeconds: number
    cookieUpdate: boolean
    pageView: boolean
    cookiePath?: string
  } = {
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

    const [trackEventPlugin] = await googleAnalytics4Web({
      ...settings,
      subscriptions
    })
    setConfigurationEvent = trackEventPlugin

    jest.spyOn(destination, 'initialize').mockImplementation(() => {
      mockGtag = jest.fn()
      return Promise.resolve(mockGtag)
    })
    await trackEventPlugin.load(Context.system(), {} as Analytics)
  })

  it('should call gtag with the correct config when consent mode is enabled', async () => {
    settings.enableConsentMode = true

    const [trackEventPlugin] = await googleAnalytics4Web({
      ...settings,
      subscriptions
    })
    setConfigurationEvent = trackEventPlugin
    await trackEventPlugin.load(Context.system(), {} as Analytics)

    const context = new Context({
      event: 'setConfigurationFields',
      type: 'page',
      properties: {
        ads_storage_consent_state: 'granted',
        analytics_storage_consent_state: 'denied'
      }
    })

    setConfigurationEvent.page?.(context)

    expect(mockGtag).toHaveBeenCalledWith('consent', 'update', {
      ad_storage: 'granted',
      analytics_storage: 'denied'
    })
    expect(mockGtag).toHaveBeenCalledWith('config', 'G-XXXXXXXXXX', {
      allow_ad_personalization_signals: false,
      allow_google_signals: false
    })
  })
  it('should call gtag with the correct config when consent mode is disabled and having values in payload', async () => {
    settings.enableConsentMode = false
    const [trackEventPlugin] = await googleAnalytics4Web({
      ...settings,
      subscriptions
    })
    setConfigurationEvent = trackEventPlugin
    await trackEventPlugin.load(Context.system(), {} as Analytics)

    const context = new Context({
      event: 'setConfigurationFields',
      type: 'page',
      properties: {
        screen_resolution: '800*600',
        user_id: 'segment123',
        page_title: 'User Registration Page',
        page_referrer: 'Home',
        language: 'EN',
        content_group: '/home/login'
      }
    })

    setConfigurationEvent.page?.(context)
    expect(mockGtag).toHaveBeenCalledWith('config', 'G-XXXXXXXXXX', {
      screen_resolution: '800*600',
      user_id: 'segment123',
      page_title: 'User Registration Page',
      page_referrer: 'Home',
      language: 'EN',
      content_group: '/home/login',
      allow_ad_personalization_signals: false,
      allow_google_signals: false
    })
  })
  it('should call gtag with the correct config when consent mode is disabled and cookie other then default value', async () => {
    settings.cookieUpdate = false
    settings.cookieExpirationInSeconds = 5
    settings.cookieDomain = 'example.com'
    settings.cookiePrefix = 'stage'
    settings.cookiePath = '/home'
    settings.enableConsentMode = false

    const [trackEventPlugin] = await googleAnalytics4Web({
      ...settings,
      subscriptions
    })
    setConfigurationEvent = trackEventPlugin
    await trackEventPlugin.load(Context.system(), {} as Analytics)

    const context = new Context({
      event: 'setConfigurationFields',
      type: 'page',
      properties: {}
    })

    setConfigurationEvent.page?.(context)

    expect(mockGtag).toHaveBeenCalledWith('config', 'G-XXXXXXXXXX', {
      allow_ad_personalization_signals: false,
      allow_google_signals: false,
      cookie_expires: 5,
      cookie_update: false,
      cookie_domain: 'example.com',
      cookie_prefix: 'stage',
      cookie_path: '/home'
    })
  })
})
