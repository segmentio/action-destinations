import { Subscription } from '@segment/browser-destination-runtime/types'
import googleCampaignManager, { destination } from '../index'
import { Analytics, Context } from '@segment/analytics-next'

const subscriptions: Subscription[] = [
  {
    partnerAction: 'salesActivity',
    name: 'Sales Activity',
    enabled: true,
    subscribe: 'type = "track"',
    mapping: {}
  }
]

describe('Google Tag for Campaign Manager', () => {
  const defaultSettings = {
    advertiserId: 'test123',
    allowAdPersonalizationSignals: false,
    conversionLinker: false
  }
  beforeEach(async () => {
    jest.restoreAllMocks()

    const [googleCampaignManagerPlugin] = await googleCampaignManager({
      ...defaultSettings,
      subscriptions
    })
    jest.spyOn(destination, 'initialize')

    await googleCampaignManagerPlugin.load(Context.system(), {} as Analytics)
  })

  it('should not update consent if enable_consent mode is denied', async () => {
    const settings = {
      ...defaultSettings,
      enableConsentMode: false
    }

    const [event] = await googleCampaignManager({ ...settings, subscriptions })
    await event.load(Context.system(), {} as Analytics)
    expect(destination.initialize).toHaveBeenCalled()

    expect(window.dataLayer).toEqual(
      expect.arrayContaining([expect.not.objectContaining(Object.assign({}, ['consent', 'default', {}]))])
    )
  })

  it('should update consent if analytics storage is granted', async () => {
    const settings = {
      ...defaultSettings,
      enableConsentMode: true,
      defaultAnalyticsStorageConsentState: 'granted'
    }

    const [event] = await googleCampaignManager({ ...settings, subscriptions })
    await event.load(Context.system(), {} as Analytics)
    expect(destination.initialize).toHaveBeenCalled()

    expect(window.dataLayer).toEqual(
      expect.arrayContaining([
        expect.objectContaining(Object.assign({}, ['consent', 'default', { analytics_storage: 'granted' }]))
      ])
    )
  })

  it('should update consent if analytics storage is denied', async () => {
    const settings = {
      ...defaultSettings,
      enableConsentMode: true,
      defaultAnalyticsStorageConsentState: 'denied'
    }

    const [event] = await googleCampaignManager({ ...settings, subscriptions })
    await event.load(Context.system(), {} as Analytics)
    expect(destination.initialize).toHaveBeenCalled()

    expect(window.dataLayer).toEqual(
      expect.arrayContaining([
        expect.objectContaining(Object.assign({}, ['consent', 'default', { analytics_storage: 'denied' }]))
      ])
    )
  })
  it('should update consent if Ad storage is granted', async () => {
    const settings = {
      ...defaultSettings,
      enableConsentMode: true,
      defaultAdsStorageConsentState: 'granted'
    }

    const [event] = await googleCampaignManager({ ...settings, subscriptions })
    await event.load(Context.system(), {} as Analytics)
    expect(destination.initialize).toHaveBeenCalled()

    expect(window.dataLayer).toEqual(
      expect.arrayContaining([
        expect.objectContaining(Object.assign({}, ['consent', 'default', { ad_storage: 'granted' }]))
      ])
    )
  })
  it('should update consent if Ad storage is denied', async () => {
    const settings = {
      ...defaultSettings,
      enableConsentMode: true,
      defaultAdsStorageConsentState: 'denied'
    }

    const [event] = await googleCampaignManager({ ...settings, subscriptions })
    await event.load(Context.system(), {} as Analytics)
    expect(destination.initialize).toHaveBeenCalled()

    expect(window.dataLayer).toEqual(
      expect.arrayContaining([
        expect.objectContaining(Object.assign({}, ['consent', 'default', { ad_storage: 'denied' }]))
      ])
    )
  })
  it('should update consent if Ad user data is granted', async () => {
    const settings = {
      ...defaultSettings,
      enableConsentMode: true,
      adUserDataConsentState: 'granted'
    }

    const [event] = await googleCampaignManager({ ...settings, subscriptions })
    await event.load(Context.system(), {} as Analytics)
    expect(destination.initialize).toHaveBeenCalled()

    expect(window.dataLayer).toEqual(
      expect.arrayContaining([
        expect.objectContaining(Object.assign({}, ['consent', 'default', { ad_user_data: 'granted' }]))
      ])
    )
  })
  it('should update consent if Ad user data is denied', async () => {
    const settings = {
      ...defaultSettings,
      enableConsentMode: true,
      adUserDataConsentState: 'denied'
    }

    const [event] = await googleCampaignManager({ ...settings, subscriptions })
    await event.load(Context.system(), {} as Analytics)
    expect(destination.initialize).toHaveBeenCalled()

    expect(window.dataLayer).toEqual(
      expect.arrayContaining([
        expect.objectContaining(Object.assign({}, ['consent', 'default', { ad_user_data: 'denied' }]))
      ])
    )
  })
  it('should update consent if Ad personalization is granted', async () => {
    const settings = {
      ...defaultSettings,
      enableConsentMode: true,
      adPersonalizationConsentState: 'granted'
    }

    const [event] = await googleCampaignManager({ ...settings, subscriptions })
    await event.load(Context.system(), {} as Analytics)
    expect(destination.initialize).toHaveBeenCalled()

    expect(window.dataLayer).toEqual(
      expect.arrayContaining([
        expect.objectContaining(Object.assign({}, ['consent', 'default', { ad_personalization: 'granted' }]))
      ])
    )
  })
  it('should update consent if Ad personalization is denied', async () => {
    const settings = {
      ...defaultSettings,
      enableConsentMode: true,
      adPersonalizationConsentState: 'denied'
    }

    const [event] = await googleCampaignManager({ ...settings, subscriptions })
    await event.load(Context.system(), {} as Analytics)
    expect(destination.initialize).toHaveBeenCalled()

    expect(window.dataLayer).toEqual(
      expect.arrayContaining([
        expect.objectContaining(Object.assign({}, ['consent', 'default', { ad_personalization: 'denied' }]))
      ])
    )
  })
})
