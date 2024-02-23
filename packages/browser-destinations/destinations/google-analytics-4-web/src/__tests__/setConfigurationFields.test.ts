import googleAnalytics4Web, { destination } from '../index'
import { Analytics, Context } from '@segment/analytics-next'
import { Subscription } from '@segment/browser-destination-runtime/types'
import type { Settings } from '../generated-types'

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
      },
      campaign_content: {
        '@path': '$.properties.campaign_content'
      },
      campaign_id: {
        '@path': '$.properties.campaign_id'
      },
      campaign_medium: {
        '@path': '$.properties.campaign_medium'
      },
      campaign_name: {
        '@path': '$.properties.campaign_name'
      },
      campaign_source: {
        '@path': '$.properties.campaign_source'
      },
      campaign_term: {
        '@path': '$.properties.campaign_term'
      }
    }
  }
]

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

    const [setConfigurationEventPlugin] = await googleAnalytics4Web({
      ...defaultSettings,
      subscriptions
    })
    setConfigurationEvent = setConfigurationEventPlugin

    jest.spyOn(destination, 'initialize').mockImplementation(() => {
      mockGtag = jest.fn()
      return Promise.resolve(mockGtag)
    })
    await setConfigurationEventPlugin.load(Context.system(), {} as Analytics)
  })

  it('should configure consent when consent mode is enabled', async () => {
    defaultSettings.enableConsentMode = true

    const [setConfigurationEventPlugin] = await googleAnalytics4Web({
      ...defaultSettings,
      subscriptions
    })
    setConfigurationEvent = setConfigurationEventPlugin
    await setConfigurationEventPlugin.load(Context.system(), {} as Analytics)

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
  it('should configure cookie expiry time other then default value', async () => {
    const settings = {
      ...defaultSettings,
      cookieExpirationInSeconds: 500
    }
    const [setConfigurationEventPlugin] = await googleAnalytics4Web({
      ...settings,
      subscriptions
    })
    setConfigurationEvent = setConfigurationEventPlugin
    await setConfigurationEventPlugin.load(Context.system(), {} as Analytics)

    const context = new Context({
      event: 'setConfigurationFields',
      type: 'page',
      properties: {}
    })

    setConfigurationEvent.page?.(context)

    expect(mockGtag).toHaveBeenCalledWith('config', 'G-XXXXXXXXXX', {
      allow_ad_personalization_signals: false,
      allow_google_signals: false,
      cookie_expires: 500
    })
  })
  it('should configure cookie domain other then default value', async () => {
    const settings = {
      ...defaultSettings,
      cookieDomain: 'example.com'
    }

    const [setConfigurationEventPlugin] = await googleAnalytics4Web({
      ...settings,
      subscriptions
    })
    setConfigurationEvent = setConfigurationEventPlugin
    await setConfigurationEventPlugin.load(Context.system(), {} as Analytics)

    const context = new Context({
      event: 'setConfigurationFields',
      type: 'page',
      properties: {}
    })

    setConfigurationEvent.page?.(context)

    expect(mockGtag).toHaveBeenCalledWith('config', 'G-XXXXXXXXXX', {
      allow_ad_personalization_signals: false,
      allow_google_signals: false,
      cookie_domain: 'example.com'
    })
  })
  it('should configure cookie prefix other then default value', async () => {
    const settings = {
      ...defaultSettings,
      cookiePrefix: 'stage'
    }
    const [setConfigurationEventPlugin] = await googleAnalytics4Web({
      ...settings,
      subscriptions
    })
    setConfigurationEvent = setConfigurationEventPlugin
    await setConfigurationEventPlugin.load(Context.system(), {} as Analytics)

    const context = new Context({
      event: 'setConfigurationFields',
      type: 'page',
      properties: {}
    })

    setConfigurationEvent.page?.(context)

    expect(mockGtag).toHaveBeenCalledWith('config', 'G-XXXXXXXXXX', {
      allow_ad_personalization_signals: false,
      allow_google_signals: false,
      cookie_prefix: 'stage'
    })
  })
  it('should configure cookie path other then default value', async () => {
    const settings = {
      ...defaultSettings,
      cookiePath: '/home'
    }

    const [setConfigurationEventPlugin] = await googleAnalytics4Web({
      ...settings,
      subscriptions
    })
    setConfigurationEvent = setConfigurationEventPlugin
    await setConfigurationEventPlugin.load(Context.system(), {} as Analytics)

    const context = new Context({
      event: 'setConfigurationFields',
      type: 'page',
      properties: {}
    })

    setConfigurationEvent.page?.(context)

    expect(mockGtag).toHaveBeenCalledWith('config', 'G-XXXXXXXXXX', {
      allow_ad_personalization_signals: false,
      allow_google_signals: false,
      cookie_path: '/home'
    })
  })
  it('should configure cookie update other then default value', async () => {
    const settings = {
      ...defaultSettings,
      cookieUpdate: false
    }
    const [setConfigurationEventPlugin] = await googleAnalytics4Web({
      ...settings,
      subscriptions
    })
    setConfigurationEvent = setConfigurationEventPlugin
    await setConfigurationEventPlugin.load(Context.system(), {} as Analytics)

    const context = new Context({
      event: 'setConfigurationFields',
      type: 'page',
      properties: {}
    })

    setConfigurationEvent.page?.(context)

    expect(mockGtag).toHaveBeenCalledWith('config', 'G-XXXXXXXXXX', {
      allow_ad_personalization_signals: false,
      allow_google_signals: false,
      cookie_update: false
    })
  })
  it('should not configure consent when consent mode is disabled', async () => {
    const settings = {
      ...defaultSettings,
      enableConsentMode: false
    }
    const [setConfigurationEventPlugin] = await googleAnalytics4Web({
      ...settings,
      subscriptions
    })
    setConfigurationEvent = setConfigurationEventPlugin
    await setConfigurationEventPlugin.load(Context.system(), {} as Analytics)

    const context = new Context({
      event: 'setConfigurationFields',
      type: 'page',
      properties: {}
    })

    setConfigurationEvent.page?.(context)
    expect(mockGtag).toHaveBeenCalledWith('config', 'G-XXXXXXXXXX', {
      allow_ad_personalization_signals: false,
      allow_google_signals: false
    })
  })
  it('should update config if payload has screen resolution', () => {
    const context = new Context({
      event: 'setConfigurationFields',
      type: 'page',
      properties: {
        screen_resolution: '800*600'
      }
    })

    setConfigurationEvent.page?.(context)
    expect(mockGtag).toHaveBeenCalledWith('config', 'G-XXXXXXXXXX', {
      allow_ad_personalization_signals: false,
      allow_google_signals: false,
      screen_resolution: '800*600'
    })
  })
  it('should update config if payload has user_id', () => {
    const context = new Context({
      event: 'setConfigurationFields',
      type: 'page',
      properties: {
        user_id: 'segment-123'
      }
    })

    setConfigurationEvent.page?.(context)
    expect(mockGtag).toHaveBeenCalledWith('config', 'G-XXXXXXXXXX', {
      allow_ad_personalization_signals: false,
      allow_google_signals: false,
      user_id: 'segment-123'
    })
  })
  it('should update config if payload has page_title', () => {
    const context = new Context({
      event: 'setConfigurationFields',
      type: 'page',
      properties: {
        page_title: 'User Registration Page'
      }
    })

    setConfigurationEvent.page?.(context)
    expect(mockGtag).toHaveBeenCalledWith('config', 'G-XXXXXXXXXX', {
      allow_ad_personalization_signals: false,
      allow_google_signals: false,
      page_title: 'User Registration Page'
    })
  })
  it('should update config if payload has language', () => {
    const context = new Context({
      event: 'setConfigurationFields',
      type: 'page',
      properties: {
        language: 'EN'
      }
    })

    setConfigurationEvent.page?.(context)
    expect(mockGtag).toHaveBeenCalledWith('config', 'G-XXXXXXXXXX', {
      allow_ad_personalization_signals: false,
      allow_google_signals: false,
      language: 'EN'
    })
  })
  it('should update config if payload has content_group', () => {
    const context = new Context({
      event: 'setConfigurationFields',
      type: 'page',
      properties: {
        content_group: '/home/login'
      }
    })

    setConfigurationEvent.page?.(context)
    expect(mockGtag).toHaveBeenCalledWith('config', 'G-XXXXXXXXXX', {
      allow_ad_personalization_signals: false,
      allow_google_signals: false,
      content_group: '/home/login'
    })
  })
  it('should update config if payload has campaign_term', () => {
    const context = new Context({
      event: 'setConfigurationFields',
      type: 'page',
      properties: {
        campaign_term: 'running+shoes'
      }
    })

    setConfigurationEvent.page?.(context)
    expect(mockGtag).toHaveBeenCalledWith('config', 'G-XXXXXXXXXX', {
      allow_ad_personalization_signals: false,
      allow_google_signals: false,
      campaign_term: 'running+shoes'
    })
  })
  it('should update config if payload has campaign_source', () => {
    const context = new Context({
      event: 'setConfigurationFields',
      type: 'page',
      properties: {
        campaign_source: 'google'
      }
    })

    setConfigurationEvent.page?.(context)
    expect(mockGtag).toHaveBeenCalledWith('config', 'G-XXXXXXXXXX', {
      allow_ad_personalization_signals: false,
      allow_google_signals: false,
      campaign_source: 'google'
    })
  })
  it('should update config if payload has campaign_name', () => {
    const context = new Context({
      event: 'setConfigurationFields',
      type: 'page',
      properties: {
        campaign_name: 'spring_sale'
      }
    })

    setConfigurationEvent.page?.(context)
    expect(mockGtag).toHaveBeenCalledWith('config', 'G-XXXXXXXXXX', {
      allow_ad_personalization_signals: false,
      allow_google_signals: false,
      campaign_name: 'spring_sale'
    })
  })
  it('should update config if payload has campaign_medium', () => {
    const context = new Context({
      event: 'setConfigurationFields',
      type: 'page',
      properties: {
        campaign_medium: 'cpc'
      }
    })

    setConfigurationEvent.page?.(context)
    expect(mockGtag).toHaveBeenCalledWith('config', 'G-XXXXXXXXXX', {
      allow_ad_personalization_signals: false,
      allow_google_signals: false,
      campaign_medium: 'cpc'
    })
  })
  it('should update config if payload has campaign_id', () => {
    const context = new Context({
      event: 'setConfigurationFields',
      type: 'page',
      properties: {
        campaign_id: 'abc.123'
      }
    })

    setConfigurationEvent.page?.(context)
    expect(mockGtag).toHaveBeenCalledWith('config', 'G-XXXXXXXXXX', {
      allow_ad_personalization_signals: false,
      allow_google_signals: false,
      campaign_id: 'abc.123'
    })
  })
  it('should update config if payload has campaign_content', () => {
    const context = new Context({
      event: 'setConfigurationFields',
      type: 'page',
      properties: {
        campaign_content: 'logolink'
      }
    })

    setConfigurationEvent.page?.(context)
    expect(mockGtag).toHaveBeenCalledWith('config', 'G-XXXXXXXXXX', {
      allow_ad_personalization_signals: false,
      allow_google_signals: false,
      campaign_content: 'logolink'
    })
  })

  it('should update config if payload has send_page_view is true', async () => {
    const settings = {
      ...defaultSettings,
      pageView: true
    }

    const [setConfigurationEventPlugin] = await googleAnalytics4Web({
      ...settings,
      subscriptions
    })
    setConfigurationEvent = setConfigurationEventPlugin
    await setConfigurationEventPlugin.load(Context.system(), {} as Analytics)

    const context = new Context({
      event: 'setConfigurationFields',
      type: 'page',
      properties: {}
    })

    setConfigurationEvent.page?.(context)
    expect(mockGtag).toHaveBeenCalledWith('config', 'G-XXXXXXXXXX', {
      allow_ad_personalization_signals: false,
      allow_google_signals: false
    })
  })
  it('should update config if payload has send_page_view is false', async () => {
    const settings = {
      ...defaultSettings,
      pageView: false
    }

    const [setConfigurationEventPlugin] = await googleAnalytics4Web({
      ...settings,
      subscriptions
    })
    setConfigurationEvent = setConfigurationEventPlugin
    await setConfigurationEventPlugin.load(Context.system(), {} as Analytics)

    const context = new Context({
      event: 'setConfigurationFields',
      type: 'page',
      properties: {}
    })

    setConfigurationEvent.page?.(context)
    expect(mockGtag).toHaveBeenCalledWith('config', 'G-XXXXXXXXXX', {
      allow_ad_personalization_signals: false,
      allow_google_signals: false,
      send_page_view: false
    })
  })
  it('should update config if payload has send_page_view is undefined', async () => {
    const settings = {
      ...defaultSettings,
      pageView: undefined
    }

    const [setConfigurationEventPlugin] = await googleAnalytics4Web({
      ...settings,
      subscriptions
    })
    setConfigurationEvent = setConfigurationEventPlugin
    await setConfigurationEventPlugin.load(Context.system(), {} as Analytics)

    const context = new Context({
      event: 'setConfigurationFields',
      type: 'page',
      properties: {}
    })

    setConfigurationEvent.page?.(context)
    expect(mockGtag).toHaveBeenCalledWith('config', 'G-XXXXXXXXXX', {
      allow_ad_personalization_signals: false,
      allow_google_signals: false,
      send_page_view: true
    })
  })
})
