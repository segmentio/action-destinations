import { InputField } from '@segment/actions-core'
import { Payload } from './addToCart/generated-types'

type AppData = Payload['app_data_field']
export const generate_app_data = (app_data: AppData) => {
  return {
    advertiser_tracking_enabled: app_data?.advertiser_tracking_enabled,
    application_tracking_enabled: app_data?.application_tracking_enabled,
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
      app_data?.storageSize ?? ''
    ].join(',')
  }
}

export const app_data_field: InputField = {
  label: 'App Data',
  description: 'TODO',
  type: 'object',
  properties: {
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
            A person can choose to enable ad tracking on an app level. Your SDK should allow an app developer to put an opt-out setting into their app. Use this field to specify the person's choice. Use 0 for disabled, 1 for enabled. `,
      default: { '@path': '$.context.device.adTrackingEnabled' }
    },
    version: {
      label: 'ExtInfo Version',
      description: `*Required for app events* Example: i2`,
      type: 'string',
      choices: [
        { label: 'iOS', value: 'i2' },
        { label: 'Android', value: 'a2' }
      ]
    },
    packageName: {
      label: 'Package Name',
      description: `Example: com.facebook.sdk.samples.hellofacebook`,
      type: 'string',
      default: { '@path': '$.context.app.namespace' }
    },
    shortVersion: {
      label: 'Short Version',
      description: `Example: 1.0`,
      type: 'string'
    },
    longVersion: {
      label: 'Long Version',
      description: `Example: 1.0 long`,
      type: 'string',
      default: { '@path': '$.context.app.version' }
    },
    osVersion: {
      label: 'OS Version',
      description: `Example: 13.4.1`,
      type: 'string',
      default: { '@path': '$.context.device.os.version' }
    },
    deviceName: {
      label: 'Device Model Name',
      description: `Example: iPhone5,1`,
      type: 'string',
      default: { '@path': '$.context.device.model' }
    },
    locale: {
      label: 'Locale',
      description: `Example: En_US`,
      type: 'string',
      default: { '@path': '$.context.locale' }
    },
    timezone: {
      label: 'Timezone Abbreviation',
      description: "Example: 'PST'",
      type: 'string'
    },
    carrier: {
      label: 'Carrier Name',
      description: 'Example: AT&T',
      type: 'string',
      default: { '@path': '$.context.network.carrier' }
    },
    width: {
      label: 'Screen Width',
      description: 'Example: 1080',
      type: 'string',
      default: { '@path': '$.context.screen.width' }
    },
    height: {
      label: 'Screen Height',
      description: 'Example: 1920',
      type: 'string',
      default: { '@path': '$.context.screen.height' }
    },
    density: {
      label: 'Screen Density',
      description: 'Example: 2.0',
      type: 'string',
      default: { '@path': '$.context.screen.density' }
    },
    cpuCores: {
      label: 'CPU Cores',
      description: 'Example: 8',
      type: 'string'
    },
    storageSize: {
      label: 'Storage Size in GBs',
      description: 'Example: 64',
      type: 'string'
    },
    freeStorage: {
      label: 'Free Storage in GBs',
      description: 'Example: 32',
      type: 'string'
    },
    deviceTimezone: {
      label: 'Device Timezone',
      description: 'Example: USA/New York',
      type: 'string',
      default: { '@path': '$.context.timezone' }
    }
  }
}
