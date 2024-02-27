import { InputField } from '@segment/actions-core'
import { Payload } from './addToCart/generated-types'

//exported for unit test
export type AppData = Payload['app_data_field']
export type GeneratedAppData = {
  advertiser_tracking_enabled: 1 | 0
  application_tracking_enabled: 1 | 0
  extinfo: string[]
}

export const generate_app_data = (app_data: AppData): GeneratedAppData | undefined => {
  if (!app_data || !app_data.use_app_data) {
    return undefined
  }

  return {
    advertiser_tracking_enabled: app_data?.advertiser_tracking_enabled ? 1 : 0,
    application_tracking_enabled: app_data?.application_tracking_enabled ? 1 : 0,
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

export const app_data_field: InputField = {
  label: 'App Events Fields',
  description: `These fields support sending app events to Facebook through the Conversions API. For more information about app events support in the Conversions API, see the Facebook docs [here](https://developers.facebook.com/docs/marketing-api/conversions-api/app-events).
  App events sent through the Conversions API must be associated with a dataset. 
  Instructions for creating a dataset can be found [here](https://www.facebook.com/business/help/750785952855662?id=490360542427371). Once a dataset is created, the dataset ID
  can be substituted for the pixel ID in the destination settings.`,
  type: 'object',
  properties: {
    use_app_data: {
      label: 'Send App Events?',
      description:
        'Segment will not send app events to Facebook by default. Enable this once you have created a dataset in Facebook and are ready to begin sending app events.',
      type: 'boolean',
      default: false
    },
    advertiser_tracking_enabled: {
      label: 'Advertiser Tracking Enabled',
      description: `*Required for app events*
            Use this field to specify ATT permission on an iOS 14.5+ device. Set to 0 for disabled or 1 for enabled.`,
      type: 'boolean'
    },
    application_tracking_enabled: {
      label: 'Application Tracking Enabled',
      type: 'boolean',
      description: `*Required for app events*
            A person can choose to enable ad tracking on an app level. Your SDK should allow an app developer to put an opt-out setting into their app. Use this field to specify the person's choice. Use 0 for disabled, 1 for enabled.`
    },
    version: {
      label: 'ExtInfo Version',
      description: `*Required for app events* Example: 'i2'.`,
      type: 'string',
      choices: [
        { label: 'iOS', value: 'i2' },
        { label: 'Android', value: 'a2' }
      ]
    },
    packageName: {
      label: 'Package Name',
      description: `Example: 'com.facebook.sdk.samples.hellofacebook'.`,
      type: 'string'
    },
    shortVersion: {
      label: 'Short Version',
      description: `Example: '1.0'.`,
      type: 'string'
    },
    longVersion: {
      label: 'Long Version',
      description: `Example: '1.0 long'.`,
      type: 'string'
    },
    osVersion: {
      label: '*Required for app events* OS Version',
      description: `Example: '13.4.1'.`,
      type: 'string'
    },
    deviceName: {
      label: 'Device Model Name',
      description: `Example: 'iPhone5,1'.`,
      type: 'string'
    },
    locale: {
      label: 'Locale',
      description: `Example: 'En_US'.`,
      type: 'string'
    },
    timezone: {
      label: 'Timezone Abbreviation',
      description: `Example: 'PST'.`,
      type: 'string'
    },
    carrier: {
      label: 'Carrier Name',
      description: `Example: 'AT&T'.`,
      type: 'string'
    },
    width: {
      label: 'Screen Width',
      description: `Example: '1080'.`,
      type: 'string'
    },
    height: {
      label: 'Screen Height',
      description: `Example: '1920'.`,
      type: 'string'
    },
    density: {
      label: 'Screen Density',
      description: `Example: '2.0'.`,
      type: 'string'
    },
    cpuCores: {
      label: 'CPU Cores',
      description: `Example: '8'.`,
      type: 'string'
    },
    storageSize: {
      label: 'Storage Size in GBs',
      description: `Example: '64'.`,
      type: 'string'
    },
    freeStorage: {
      label: 'Free Storage in GBs',
      description: `Example: '32'.`,
      type: 'string'
    },
    deviceTimezone: {
      label: 'Device Timezone',
      description: `Example: 'USA/New York'.`,
      type: 'string'
    }
  },
  default: {
    application_tracking_enabled: {
      '@path': '$.context.device.adTrackingEnabled'
    },
    packageName: {
      '@path': '$.context.app.namespace'
    },
    longVersion: {
      '@path': '$.context.app.version'
    },
    osVersion: {
      '@path': '$.context.os.version'
    },
    deviceName: {
      '@path': '$.context.device.model'
    },
    locale: {
      '@path': '$.context.locale'
    },
    carrier: {
      '@path': '$.context.network.carrier'
    },
    width: {
      '@path': '$.context.screen.width'
    },
    height: {
      '@path': '$.context.screen.height'
    },
    density: {
      '@path': '$.context.screen.density'
    },
    deviceTimezone: {
      '@path': '$.context.timezone'
    }
  }
}
