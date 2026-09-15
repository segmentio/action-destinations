import type { InputField } from '@segment/actions-core'

/**
 * Fields shared by Application Installed and Application Opened. Both post the same payload
 * shape to the same server-to-server endpoint and differ only in a handful of fields.
 */
export const s2sCommonFields: Record<string, InputField> = {
  appsflyer_id: {
    label: 'AppsFlyer ID',
    description: 'The AppsFlyer device identifier. If omitted, the advertising ID is used.',
    type: 'string',
    required: false,
    default: {
      // The classic destination read this through a case-insensitive lookup, so both
      // spellings appear in customer payloads. Check both so neither silently drops.
      '@if': {
        exists: { '@path': '$.integrations.AppsFlyer.appsflyer_id' },
        then: { '@path': '$.integrations.AppsFlyer.appsflyer_id' },
        else: { '@path': '$.integrations.AppsFlyer.appsFlyerId' }
      }
    }
  },
  device_type: {
    label: 'Device Type',
    description: 'The device platform. Must be `ios`, `android` or `roku`.',
    type: 'string',
    required: true,
    default: { '@path': '$.context.device.type' }
  },
  timestamp: {
    label: 'Timestamp',
    description: 'When the event occurred. Required — this value is part of the request signature.',
    type: 'datetime',
    required: true,
    default: { '@path': '$.timestamp' }
  },
  ip: {
    label: 'IP Address',
    description: 'The device IP address. Required — this value is part of the request signature.',
    type: 'string',
    required: true,
    default: { '@path': '$.context.ip' }
  },
  locale: {
    label: 'Locale',
    description: 'The device locale. Required — this value is part of the request signature.',
    type: 'string',
    required: true,
    default: { '@path': '$.context.locale' }
  },
  advertising_id: {
    label: 'Advertising ID',
    description: 'The device advertising ID. Sent as `idfa` on iOS and `advertising_id` on Android and Roku.',
    type: 'string',
    required: false,
    default: { '@path': '$.context.device.advertisingId' }
  },
  device_id: {
    label: 'Device ID',
    description: 'The iOS vendor identifier, used when the advertising ID is unavailable or zeroed out.',
    type: 'string',
    required: false,
    default: { '@path': '$.context.device.id' }
  },
  ad_tracking_enabled: {
    label: 'Ad Tracking Enabled',
    description: 'Whether the user has allowed ad tracking. Sent to AppsFlyer as the `aie` flag.',
    type: 'boolean',
    required: false,
    default: { '@path': '$.context.device.adTrackingEnabled' }
  },
  user_agent: {
    label: 'User Agent',
    description: 'The device user agent.',
    type: 'string',
    required: false,
    default: { '@path': '$.context.userAgent' }
  },
  os_version: {
    label: 'OS Version',
    description: 'The device OS version.',
    type: 'string',
    required: false,
    default: { '@path': '$.context.os.version' }
  },
  device_model: {
    label: 'Device Model',
    description: 'The device model, sent to AppsFlyer as `type`.',
    type: 'string',
    required: false,
    default: { '@path': '$.context.device.model' }
  },
  bundle_id: {
    label: 'Bundle ID',
    description: 'The app bundle identifier. Sent for iOS only.',
    type: 'string',
    required: false,
    default: { '@path': '$.context.app.namespace' }
  },
  att: {
    label: 'ATT Status',
    description: 'The iOS App Tracking Transparency status. Sent for iOS only.',
    type: 'number',
    required: false,
    default: { '@path': '$.context.device.att' }
  },
  uid: {
    label: 'User ID',
    description: 'Your own identifier for the user.',
    type: 'string',
    required: false,
    default: { '@path': '$.userId' }
  },
  anonymous_id: {
    label: 'Anonymous ID',
    description: 'The Segment anonymous ID, used as a fallback identifier.',
    type: 'string',
    required: false,
    default: { '@path': '$.anonymousId' }
  },
  campaign: {
    label: 'Apple Search Ads Campaign',
    description: "Campaign attribution, mapped to AppsFlyer's Apple Search Ads fields. Sent for iOS only.",
    type: 'object',
    required: false,
    default: { '@path': '$.context.campaign' }
  },
  fb_cookie: {
    label: 'Facebook Cookie',
    description: 'The Facebook cookie associated with this user.',
    type: 'string',
    required: false,
    default: { '@path': '$.integrations.AppsFlyer.fb_cookie' }
  },
  cid: {
    label: 'Customer User ID',
    description: 'Your customer user ID. AppsFlyer prefers this over the User ID when both are present.',
    type: 'string',
    required: false,
    default: { '@path': '$.integrations.AppsFlyer.cid' }
  }
}
