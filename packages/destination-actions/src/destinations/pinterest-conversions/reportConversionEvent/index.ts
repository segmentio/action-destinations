import type { ActionDefinition, RequestClient } from '@segment/actions-core'
import { IntegrationError } from '@segment/actions-core'
import type { DependsOnConditions } from '@segment/actions-core/destination-kit/types'
import { API_VERSION, PARTNER_NAME, EVENT_NAME } from '../constants'
import type { Settings } from '../generated-types'
import { getCustomDataField, getCustomDataField2, getContentsField } from '../pinterest-capi-custom-data'
import { user_data_field, hash_user_data } from '../pinterset-capi-user-data'
import type { Payload } from './generated-types'
import type { PinterestEventPayload, LegacyPinterestEventPayload, CustomData } from '../types'
import isEmpty from 'lodash/isEmpty'
import dayjs from '../../../lib/dayjs'

const DEPENDS_ON_LEGACY: DependsOnConditions = {
  match: 'any',
  conditions: [
    { fieldKey: 'data_format', operator: 'is', value: 'legacy' },
    { fieldKey: 'data_format', operator: 'is', value: undefined }
  ]
}

const DEPENDS_ON_LATEST: DependsOnConditions = {
  conditions: [{ fieldKey: 'data_format', operator: 'is', value: 'latest' }]
}

const action: ActionDefinition<Settings, Payload> = {
  title: 'Report Conversion Event',
  description:
    'Report events directly to Pinterest. Data shared can power Pinterest solutions that will help evaluate ads effectiveness and improve content, targeting, and placement of future ads.',
  fields: {
    data_format: {
      label: 'Use Latest Fields',
      description:
        'Switch between the latest field configuration and the legacy fields. New instances default to the latest fields.',
      type: 'string',
      choices: [
        { label: 'Latest Fields', value: 'latest' },
        { label: 'Legacy Fields', value: 'legacy' }
      ],
      default: 'latest'
    },
    event_name: {
      label: 'Event Name',
      description:
        'The conversion event type. For custom events, you must use the predefined event name "custom". Please refer to the possible event types in [Pinterest API docs](https://developers.pinterest.com/docs/api/v5/#operation/events/create).',
      type: 'string',
      required: true,
      choices: [
        { label: 'Add Payment Info', value: EVENT_NAME.ADD_PAYMENT_INFO },
        { label: 'Add to Cart', value: EVENT_NAME.ADD_TO_CART },
        { label: 'Add to Wishlist', value: EVENT_NAME.ADD_TO_WISHLIST },
        { label: 'App Install', value: EVENT_NAME.APP_INSTALL },
        { label: 'App Open', value: EVENT_NAME.APP_OPEN },
        { label: 'Checkout', value: EVENT_NAME.CHECKOUT },
        { label: 'Contact', value: EVENT_NAME.CONTACT },
        { label: 'Custom', value: EVENT_NAME.CUSTOM },
        { label: 'Customize Product', value: EVENT_NAME.CUSTOMIZE_PRODUCT },
        { label: 'Find Location', value: EVENT_NAME.FIND_LOCATION },
        { label: 'Initiate Checkout', value: EVENT_NAME.INITIATE_CHECKOUT },
        { label: 'Lead', value: EVENT_NAME.LEAD },
        { label: 'Page Visit', value: EVENT_NAME.PAGE_VISIT },
        { label: 'Schedule', value: EVENT_NAME.SCHEDULE },
        { label: 'Search', value: EVENT_NAME.SEARCH },
        { label: 'Sign Up', value: EVENT_NAME.SIGNUP },
        { label: 'Start Trial', value: EVENT_NAME.START_TRIAL },
        { label: 'Submit Application', value: EVENT_NAME.SUBMIT_APPLICATION },
        { label: 'Subscribe', value: EVENT_NAME.SUBSCRIBE },
        { label: 'View Category', value: EVENT_NAME.VIEW_CATEGORY },
        { label: 'View Content', value: EVENT_NAME.VIEW_CONTENT },
        { label: 'Watch Video', value: EVENT_NAME.WATCH_VIDEO }
      ]
    },
    action_source: {
      label: 'Action Source',
      description:
        'The source indicating where the conversion event occurred. This must be app_android, app_ios , web or offline.',
      type: 'string',
      required: true,
      choices: [
        { label: 'App Android', value: 'app_android' },
        { label: 'App IOS', value: 'app_ios' },
        { label: 'Web', value: 'web' },
        { label: 'Offline', value: 'offline' }
      ],
      default: 'web'
    },
    event_time: {
      label: 'Event Timestamp',
      description:
        'Device IDs can be used to add and remove only anonymous users to/from a cohort. However, users with an assigned User ID cannot use Device ID to sync to a cohort.',
      type: 'string',
      required: true,
      default: {
        '@path': '$.timestamp'
      }
    },
    event_id: {
      label: 'Event ID',
      description:
        'A unique id string that identifies this event and can be used for deduping between events ingested via both the conversion API and Pinterest tracking.',
      type: 'string',
      required: true,
      default: {
        '@path': '$.messageId'
      }
    },
    event_source_url: {
      label: 'Event Source URL',
      description: 'URL of the web conversion event.',
      type: 'string',
      default: {
        '@path': '$.context.page.url'
      }
    },
    opt_out: {
      label: 'Opt Out',
      description:
        'When action_source is web or offline, it defines whether the user has opted out of tracking for web conversion events. While when action_source is app_android or app_ios, it defines whether the user has enabled Limit Ad Tracking on their iOS device, or opted out of Ads Personalization on their Android device.',
      type: 'boolean',
      default: true
    },
    advertiser_tracking_enabled: {
      label: 'Advertiser Tracking Enabled',
      description: 'Defines whether the user has enabled ATT permission on their iOS device.',
      type: 'boolean',
      default: {
        '@path': '$.context.device.adTrackingEnabled'
      }
    },
    user_data: user_data_field,

    // --- Legacy fields (shown when data_format is 'legacy' or undefined) ---
    custom_data: getCustomDataField(DEPENDS_ON_LEGACY),
    app_id: {
      label: '[Legacy] App ID',
      description: 'The app store app ID.',
      type: 'string',
      depends_on: DEPENDS_ON_LEGACY,
      default: {
        '@path': 'context.app.id'
      }
    },
    app_name: {
      label: '[Legacy] App Name',
      description: 'Name of the app.',
      type: 'string',
      required: DEPENDS_ON_LEGACY,
      depends_on: DEPENDS_ON_LEGACY,
      default: {
        '@path': '$.context.app.name'
      }
    },
    app_version: {
      label: '[Legacy] App Version',
      description: 'Version of the app.',
      type: 'string',
      depends_on: DEPENDS_ON_LEGACY,
      default: {
        '@path': '$.context.app.version'
      }
    },
    device_brand: {
      label: '[Legacy] Device Brand',
      description: 'Brand of the user device.',
      type: 'string',
      depends_on: DEPENDS_ON_LEGACY,
      default: {
        '@path': '$.context.device.brand'
      }
    },
    device_carrier: {
      label: '[Legacy] Device Carrier',
      description: "User device's mobile carrier.",
      type: 'string',
      depends_on: DEPENDS_ON_LEGACY,
      default: {
        '@path': 'context.device.carrier'
      }
    },
    device_model: {
      label: '[Legacy] Device Model',
      description: 'Model of the user device.',
      type: 'string',
      depends_on: DEPENDS_ON_LEGACY,
      default: {
        '@path': '$.context.device.model'
      }
    },
    device_type: {
      label: '[Legacy] Device Type',
      description: 'Type of the user device.',
      type: 'string',
      depends_on: DEPENDS_ON_LEGACY,
      default: {
        '@path': '$.context.device.type'
      }
    },
    os_version: {
      label: '[Legacy] OS Version',
      description: 'Version of the device operating system.',
      type: 'string',
      depends_on: DEPENDS_ON_LEGACY,
      default: {
        '@path': '$.context.os.version'
      }
    },

    // --- Latest fields (shown when data_format is 'latest') ---
    custom_data_2: getCustomDataField2(DEPENDS_ON_LATEST),
    contents: getContentsField(DEPENDS_ON_LATEST),
    app_info: {
      label: 'App Info',
      description: 'Object containing information about the application where event occurred.',
      type: 'object',
      additionalProperties: false,
      defaultObjectUI: 'keyvalue',
      depends_on: DEPENDS_ON_LATEST,
      properties: {
        app_id: {
          label: 'App ID',
          type: 'string',
          description: 'App ID in Google Play Store, AppStore or other stores.'
        },
        app_name: {
          label: 'App Name',
          type: 'string',
          description: 'Name of the app.'
        },
        app_package_name: {
          label: 'App Package Name',
          type: 'string',
          description: 'App package name.'
        },
        app_store: {
          label: 'App Store',
          type: 'string',
          description: 'The name of the app distributor or store from which the app was installed.'
        },
        app_version: {
          label: 'App Version',
          type: 'string',
          description: 'App version.'
        },
        install_time: {
          label: 'Install Time',
          type: 'datetime',
          description: 'App install time. Accepts ISO 8601 format or Unix timestamp in seconds (10 digit).'
        },
        user_agent: {
          label: 'User Agent',
          type: 'string',
          description: 'User Agent request header.'
        },
        window_height: {
          label: 'Window Height',
          type: 'integer',
          description: 'Inner height of the window or viewport.'
        },
        window_width: {
          label: 'Window Width',
          type: 'integer',
          description: 'Inner width of the window or viewport.'
        }
      },
      default: {
        app_name: { '@path': '$.context.app.name' },
        app_package_name: { '@path': '$.context.app.namespace' },
        app_version: { '@path': '$.context.app.version' },
        user_agent: { '@path': '$.context.userAgent' },
        window_height: { '@path': '$.context.screen.height' },
        window_width: { '@path': '$.context.screen.width' }
      }
    },
    device_info: {
      label: 'Device Info',
      description: 'Object containing information about the device where event occurred.',
      type: 'object',
      additionalProperties: false,
      defaultObjectUI: 'keyvalue',
      depends_on: DEPENDS_ON_LATEST,
      properties: {
        battery_level: {
          label: 'Battery Level',
          type: 'integer',
          description: 'Battery charge level percentage.'
        },
        brand: {
          label: 'Brand',
          type: 'string',
          description: 'Device brand.'
        },
        carrier: {
          label: 'Carrier',
          type: 'string',
          description: "User device's mobile carrier."
        },
        cpu_cores: {
          label: 'CPU Cores',
          type: 'integer',
          description: 'Number of CPU cores.'
        },
        external_storage_free_space: {
          label: 'External Storage Free Space',
          type: 'integer',
          description: 'External storage free space in GB.'
        },
        external_storage_size: {
          label: 'External Storage Size',
          type: 'integer',
          description: 'External storage size in GB.'
        },
        form_factor: {
          label: 'Form Factor',
          type: 'string',
          description: 'Device form factor (desktop, laptop, cellphone, tablet, smartwatch, tv, vr, console, other).',
          choices: [
            { label: 'desktop', value: 'desktop' },
            { label: 'laptop', value: 'laptop' },
            { label: 'cellphone', value: 'cellphone' },
            { label: 'tablet', value: 'tablet' },
            { label: 'smartwatch', value: 'smartwatch' },
            { label: 'tv', value: 'tv' },
            { label: 'vr', value: 'vr' },
            { label: 'console', value: 'console' },
            { label: 'other', value: 'other' }
          ],
          default: 'other'
        },
        kernel_version: {
          label: 'Kernel Version',
          type: 'string',
          description: "Kernel version of the device's operating system."
        },
        languages: {
          label: 'Languages',
          type: 'string',
          multiple: true,
          description: 'List of user installed languages. ISO 639-1 format. For example, ["en", "fr", "es"].'
        },
        locale: {
          label: 'Locale',
          type: 'string',
          description: 'Device locale in BCP-47 format.'
        },
        model: {
          label: 'Model',
          type: 'string',
          description: 'Device model name.'
        },
        network_type: {
          label: 'Network Type',
          type: 'string',
          description:
            'Network type (wifi, cellular_2g, cellular_3g, cellular_4g, cellular_5g, cellular_6g, ethernet, unknown).'
        },
        os_family: {
          label: 'OS Family',
          type: 'string',
          description: 'OS Family (ios, android, macos, windows, linux, bsd, other).',
          choices: [
            { label: 'ios', value: 'ios' },
            { label: 'android', value: 'android' },
            { label: 'macos', value: 'macos' },
            { label: 'windows', value: 'windows' },
            { label: 'linux', value: 'linux' },
            { label: 'bsd', value: 'bsd' },
            { label: 'other', value: 'other' }
          ],
          default: 'other'
        },
        os_name: {
          label: 'OS Name',
          type: 'string',
          description: 'Short name of the OS.',
          maximum: 100
        },
        os_release_name: {
          label: 'OS Release Name',
          type: 'string',
          description: 'Marketing name for the release version.'
        },
        os_version: {
          label: 'OS Version',
          type: 'string',
          description: 'Full name of the OS version.',
          maximum: 100
        },
        screen_density: {
          label: 'Screen Density',
          type: 'integer',
          description: 'Screen density, PPI.'
        },
        screen_height: {
          label: 'Screen Height',
          type: 'integer',
          description: 'Screen height in pixels.'
        },
        screen_width: {
          label: 'Screen Width',
          type: 'integer',
          description: 'Screen width in pixels.'
        },
        storage_free_space: {
          label: 'Storage Free Space',
          type: 'integer',
          description: 'Internal storage free space in GB.'
        },
        storage_size: {
          label: 'Storage Size',
          type: 'integer',
          description: 'Internal storage size in GB.'
        },
        timezone: {
          label: 'Timezone',
          type: 'string',
          description: 'Device timezone.'
        },
        timezone_abbr: {
          label: 'Timezone Abbreviation',
          type: 'string',
          description: 'Timezone abbreviation.'
        },
        type: {
          label: 'Type',
          type: 'string',
          description: 'Device type.'
        }
      },
      default: {
        brand: { '@path': '$.context.device.manufacturer' },
        carrier: { '@path': '$.context.network.carrier' },
        model: { '@path': '$.context.device.model' },
        type: { '@path': '$.context.device.type' },
        os_version: { '@path': '$.context.os.version' },
        locale: { '@path': '$.context.locale' },
        screen_density: { '@path': '$.context.screen.density' },
        screen_height: { '@path': '$.context.screen.height' },
        screen_width: { '@path': '$.context.screen.width' },
        timezone: { '@path': '$.context.timezone' }
      }
    },

    // --- Shared fields (always shown) ---
    wifi: {
      label: 'Wifi',
      description: 'Whether the event occurred when the user device was connected to wifi.',
      type: 'boolean',
      default: {
        '@path': '$.context.network.wifi'
      }
    },
    language: {
      label: 'Language',
      description: "Two-character ISO-639-1 language code indicating the user's language.",
      type: 'string'
    }
  },
  perform: async (request, { settings, payload }) => {
    return processPayload(request, settings, payload)
  }
}

async function processPayload(request: RequestClient, settings: Settings, payload: Payload) {
  if (
    isEmpty(payload.user_data?.email) &&
    isEmpty(payload.user_data?.hashed_maids) &&
    !(payload.user_data?.client_ip_address && payload.user_data?.client_user_agent)
  ) {
    throw new IntegrationError(
      `User data must contain values for Email or Phone Number or Mobile Ad Identifier or both IP Address and User Agent fields`,
      'Misconfigured required field',
      400
    )
  }

  const data = createPinterestPayload(payload)
  return request(`https://api.pinterest.com/${API_VERSION}/ad_accounts/${settings.ad_account_id}/events`, {
    method: 'POST',
    json: {
      data: data
    }
  })
}

function convertInstallTime(value: string | number | undefined | null): number | undefined {
  if (value === undefined || value === null || value === '') return undefined
  if (typeof value === 'number') return value
  const parsed = dayjs.utc(value)
  if (!parsed.isValid()) return undefined
  return parsed.unix()
}

function buildAppInfo(payload: Payload) {
  const appInfo = {
    ...payload.app_info,
    install_time: convertInstallTime(payload.app_info?.install_time)
  }
  const hasContent = Object.values(appInfo).some((v) => v !== undefined && v !== null)
  return hasContent ? appInfo : undefined
}

function buildDeviceInfo(payload: Payload) {
  if (!payload.device_info) return undefined
  const hasContent = Object.values(payload.device_info).some((v) => v !== undefined && v !== null)
  return hasContent ? payload.device_info : undefined
}

function buildCustomData(payload: Payload): CustomData {
  const isStructured = payload.data_format === 'latest'

  if (isStructured) {
    return {
      currency: payload.custom_data_2?.currency,
      value: typeof payload.custom_data_2?.value === 'number' ? String(payload.custom_data_2.value) : undefined,
      content_ids: payload.custom_data_2?.content_ids,
      contents: payload.contents?.map((item) => ({
        ...item,
        item_price: typeof item.item_price === 'number' ? String(item.item_price) : undefined
      })),
      num_items: payload.custom_data_2?.num_items,
      order_id: payload.custom_data_2?.order_id,
      search_string: payload.custom_data_2?.search_string,
      opt_out_type: payload.custom_data_2?.opt_out_type,
      content_brand: payload.custom_data_2?.content_brand,
      content_category: payload.custom_data_2?.content_category,
      content_name: payload.custom_data_2?.content_name,
      predicted_ltv:
        typeof payload.custom_data_2?.predicted_ltv === 'number'
          ? String(payload.custom_data_2.predicted_ltv)
          : undefined,
      np: PARTNER_NAME
    }
  }

  return {
    currency: payload.custom_data?.currency,
    value: typeof payload.custom_data?.value === 'number' ? String(payload.custom_data.value) : undefined,
    content_ids: payload.custom_data?.content_ids,
    contents: payload.custom_data?.contents?.map((item) => ({
      ...item,
      item_price: typeof item.item_price === 'number' ? String(item.item_price) : undefined
    })),
    num_items: payload.custom_data?.num_items,
    order_id: payload.custom_data?.order_id,
    search_string: payload.custom_data?.search_string,
    opt_out_type: payload.custom_data?.opt_out_type,
    content_brand: payload.custom_data?.content_brand,
    content_category: payload.custom_data?.content_category,
    content_name: payload.custom_data?.content_name,
    predicted_ltv:
      typeof payload.custom_data?.predicted_ltv === 'number' ? String(payload.custom_data.predicted_ltv) : undefined,
    np: PARTNER_NAME
  }
}

function createPinterestPayload(payload: Payload): (PinterestEventPayload | LegacyPinterestEventPayload)[] {
  const isStructured = payload.data_format === 'latest'

  return [
    {
      event_name: payload.event_name,
      action_source: payload.action_source,
      event_time: dayjs.utc(payload.event_time).unix(),
      event_id: payload.event_id,
      event_source_url: payload.event_source_url,
      partner_name: PARTNER_NAME,
      opt_out: payload.opt_out,
      advertiser_tracking_enabled: payload.advertiser_tracking_enabled,
      user_data: hash_user_data({ user_data: payload.user_data }),
      custom_data: buildCustomData(payload),
      app_id: isStructured ? undefined : payload.app_id,
      app_name: isStructured ? undefined : payload.app_name,
      app_version: isStructured ? undefined : payload.app_version,
      app_info: isStructured ? buildAppInfo(payload) : undefined,
      device_brand: isStructured ? undefined : payload.device_brand,
      device_carrier: isStructured ? undefined : payload.device_carrier,
      device_model: isStructured ? undefined : payload.device_model,
      device_type: isStructured ? undefined : payload.device_type,
      os_version: isStructured ? undefined : payload.os_version,
      device_info: isStructured ? buildDeviceInfo(payload) : undefined,
      wifi: payload.wifi,
      language: payload.language
    }
  ]
}

export default action
