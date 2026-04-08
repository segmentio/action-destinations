import { Payload } from './addToCart/generated-types'

//exported for unit test
export type AppData = Payload['app_data_field']
export type GeneratedAppData = {
  advertiser_tracking_enabled: 1 | 0
  application_tracking_enabled: 1 | 0
  madid?: string
  extinfo: string[]
}

export const generate_app_data = (app_data: AppData): GeneratedAppData | undefined => {
  if (!app_data || !app_data.use_app_data) {
    return undefined
  }

  return {
    advertiser_tracking_enabled: app_data?.advertiser_tracking_enabled ? 1 : 0,
    application_tracking_enabled: app_data?.application_tracking_enabled ? 1 : 0,
    madid: app_data?.madId,
    extinfo: [
      app_data?.version ?? '',
      app_data?.packageName ?? '',
      app_data?.shortVersion ?? '',
      app_data?.longVersion ?? '',
      app_data?.osVersion ?? '',
      app_data?.deviceName ?? '',
      app_data?.locale ?? '',
      app_data?.timezone ?? '',
      app_data?.carrier ?? '',
      app_data?.width ?? '',
      app_data?.height ?? '',
      app_data?.density ?? '',
      app_data?.cpuCores ?? '',
      app_data?.storageSize ?? '',
      app_data?.freeStorage ?? '',
      app_data?.deviceTimezone ?? ''
    ]
  }
}
