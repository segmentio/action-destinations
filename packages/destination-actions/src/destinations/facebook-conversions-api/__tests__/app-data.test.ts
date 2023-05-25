import { generate_app_data, AppData, GeneratedAppData } from '../fb-capi-app-data'

describe('FacebookConversionsApi', () => {
  describe('AppData', () => {
    const sampleAppDataComplete: AppData = {
      use_app_data: true,
      advertiser_tracking_enabled: true,
      application_tracking_enabled: true,
      version: 'i2',
      packageName: 'com.segment.app',
      shortVersion: '1.0.0',
      longVersion: '1.0.0',
      osVersion: '19.5',
      deviceName: 'iPhone 19,1',
      locale: 'en_US',
      timezone: 'America/Los_Angeles',
      carrier: 'T-Mobile',
      width: '1920',
      height: '1080',
      density: '2.0',
      cpuCores: '8',
      storageSize: '128',
      freeStorage: '64',
      deviceTimezone: 'America/Los_Angeles'
    }
    const sampleAppDataIncomplete: AppData = {
      ...sampleAppDataComplete
    }
    delete sampleAppDataIncomplete.timezone
    delete sampleAppDataIncomplete.carrier
    delete sampleAppDataIncomplete.deviceTimezone

    it('generated app data should always have a length 16 exinfo array', () => {
      let appData: GeneratedAppData | undefined = generate_app_data(sampleAppDataComplete)
      if (appData) {
        expect(appData.extinfo.length).toBe(16)
      }
      expect(appData).toBeDefined()

      appData = generate_app_data(sampleAppDataIncomplete)
      if (appData) {
        expect(appData.extinfo.length).toBe(16)
      }
      expect(appData).toBeDefined()
    })

    it('generated app data should be undefined if use_app_data is false', () => {
      const appData = generate_app_data({
        use_app_data: false
      })
      expect(appData).toBeUndefined()
    })

    it('generated app data should include empty strings if fields are missing from extinfo', () => {
      const appData = generate_app_data(sampleAppDataIncomplete)
      if (appData) {
        expect(appData.advertiser_tracking_enabled).toBe(1)
        expect(appData.application_tracking_enabled).toBe(1)

        expect(appData.extinfo[0]).toBe(sampleAppDataIncomplete.version)
        expect(appData.extinfo[1]).toBe(sampleAppDataIncomplete.packageName)
        expect(appData.extinfo[2]).toBe(sampleAppDataIncomplete.shortVersion)
        expect(appData.extinfo[3]).toBe(sampleAppDataIncomplete.longVersion)
        expect(appData.extinfo[4]).toBe(sampleAppDataIncomplete.osVersion)
        expect(appData.extinfo[5]).toBe(sampleAppDataIncomplete.deviceName)
        expect(appData.extinfo[6]).toBe(sampleAppDataIncomplete.locale)
        expect(appData.extinfo[7]).toBe('')
        expect(appData.extinfo[8]).toBe('')
        expect(appData.extinfo[9]).toBe(sampleAppDataIncomplete.width)
        expect(appData.extinfo[10]).toBe(sampleAppDataIncomplete.height)
        expect(appData.extinfo[11]).toBe(sampleAppDataIncomplete.density)
        expect(appData.extinfo[12]).toBe(sampleAppDataIncomplete.cpuCores)
        expect(appData.extinfo[13]).toBe(sampleAppDataIncomplete.storageSize)
        expect(appData.extinfo[14]).toBe(sampleAppDataIncomplete.freeStorage)
        expect(appData.extinfo[15]).toBe('')
      }
      expect(appData).toBeDefined()
    })
  })
})
