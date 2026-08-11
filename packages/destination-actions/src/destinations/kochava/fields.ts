import type { InputField } from '@segment/actions-core'

/**
 * Fields shared by both the Install Notification and Post-Install Event actions.
 * Each action spreads these into its own `fields` object.
 */
export const commonFields: Record<string, InputField> = {
  kochava_app_id: {
    label: 'Kochava App ID',
    description: 'The Kochava App GUID. Overrides the Kochava App ID configured in Settings for this event.',
    type: 'string',
    required: false
  },
  kochava_device_id: {
    label: 'Kochava Device ID',
    description: 'A consistent, unique device identifier. May be omitted when Device IDs are provided.',
    type: 'string',
    required: false,
    default: { '@path': '$.context.device.id' }
  },
  idfa: {
    label: 'IDFA',
    description: 'iOS advertising identifier (IDFA). At least one device identifier is required.',
    type: 'string',
    required: false,
    default: { '@path': '$.context.device.advertisingId' }
  },
  idfv: {
    label: 'IDFV',
    description: 'iOS vendor identifier (IDFV). At least one device identifier is required.',
    type: 'string',
    required: false
  },
  adid: {
    label: 'ADID',
    description: 'Android/Google advertising identifier (ADID). At least one device identifier is required.',
    type: 'string',
    required: false
  },
  android_id: {
    label: 'Android ID',
    description: 'Android device identifier. At least one device identifier is required.',
    type: 'string',
    required: false
  },
  device_ua: {
    label: 'Device User Agent',
    description: 'The device user agent string. Either this or Device OS Version is required for OS detection.',
    type: 'string',
    required: false,
    default: { '@path': '$.context.userAgent' }
  },
  device_ver: {
    label: 'Device OS Version',
    description: 'The device OS version. Either this or Device User Agent is required for OS detection.',
    type: 'string',
    required: false,
    default: { '@path': '$.context.os.version' }
  },
  origination_ip: {
    label: 'Origination IP',
    description: 'The IP address of the device.',
    type: 'string',
    required: false,
    default: { '@path': '$.context.ip' }
  },
  app_version: {
    label: 'App Version',
    description: 'The version of the application.',
    type: 'string',
    required: false,
    default: { '@path': '$.context.app.version' }
  },
  usertime: {
    label: 'User Time',
    description: 'The time the event occurred. Sent to Kochava as epoch seconds.',
    type: 'datetime',
    required: false,
    default: { '@path': '$.timestamp' }
  },
  att: {
    label: 'ATT Authorized',
    description: 'iOS 14+ App Tracking Transparency authorization status.',
    type: 'boolean',
    required: false
  },
  att_time: {
    label: 'ATT Time',
    description: 'iOS 14+ App Tracking Transparency prompt time (epoch seconds).',
    type: 'number',
    required: false
  },
  att_duration: {
    label: 'ATT Duration',
    description: 'iOS 14+ App Tracking Transparency prompt duration in seconds.',
    type: 'number',
    required: false
  },
  att_detail: {
    label: 'ATT Detail',
    description: 'iOS 14+ App Tracking Transparency additional detail.',
    type: 'string',
    required: false
  }
}
