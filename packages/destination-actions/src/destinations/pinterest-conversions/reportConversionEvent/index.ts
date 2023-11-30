import type { ActionDefinition, RequestClient } from '@segment/actions-core'
import { IntegrationError } from '@segment/actions-core'
import { API_VERSION, PARTNER_NAME } from '../constants'
import type { Settings } from '../generated-types'
import { custom_data_field } from '../pinterest-capi-custom-data'
import { user_data_field, hash_user_data } from '../pinterset-capi-user-data'
import type { Payload } from './generated-types'
import isEmpty from 'lodash/isEmpty'
import dayjs from '../../../lib/dayjs'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Report Conversion Event',
  description:
    'Report events directly to Pinterest. Data shared can power Pinterest solutions that will help evaluate ads effectiveness and improve content, targeting, and placement of future ads.',
  fields: {
    event_name: {
      label: 'Event Name',
      description:
        'The conversion event type. For custom events, you must use the predefined event name "custom". Please refer to the possible event types in [Pinterest API docs](https://developers.pinterest.com/docs/api/v5/#operation/events/create).',
      type: 'string',
      required: true,
      choices: [
        { label: 'Add to Cart', value: 'add_to_cart' },
        { label: 'Checkout', value: 'checkout' },
        { label: 'Lead', value: 'lead' },
        { label: 'Page Visit', value: 'page_visit' },
        { label: 'Search', value: 'search' },
        { label: 'Sign Up', value: 'signup' },
        { label: 'View Category', value: 'view_category' },
        { label: 'Watch Video', value: 'watch_video' },
        { label: 'Custom', value: 'custom' }
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
    user_data: user_data_field,
    custom_data: custom_data_field,
    app_id: {
      label: 'App ID',
      description: 'The app store app ID.',
      type: 'string',
      default: {
        '@path': 'context.app.id'
      }
    },
    app_name: {
      label: 'App Name',
      description: 'Name of the app. ',
      type: 'string',
      required: true,
      default: {
        '@path': '$.context.app.name'
      }
    },
    app_version: {
      label: 'App Version',
      description: 'Version of the app.',
      type: 'string',
      default: {
        '@path': '$.context.app.version'
      }
    },
    device_brand: {
      label: 'Device Brand',
      description: 'Brand of the user device.',
      type: 'string',
      default: {
        '@path': '$.context.device.brand'
      }
    },
    device_carrier: {
      label: 'Device Carrier',
      description: 'User device’s mobile carrier. ',
      type: 'string',
      default: {
        '@path': 'context.device.carrier'
      }
    },
    device_model: {
      label: 'Device Model',
      description: 'Model of the user device.',
      type: 'string',
      default: {
        '@path': '$.context.device.model'
      }
    },
    device_type: {
      label: 'Device Type',
      description: 'Type of the user device.',
      type: 'string',
      default: {
        '@path': '$.context.device.type'
      }
    },
    os_version: {
      label: 'OS Version',
      description: 'Version of the device operating system.',
      type: 'string',
      default: {
        '@path': '$.context.os.version'
      }
    },
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

function createPinterestPayload(payload: Payload) {
  return [
    {
      event_name: payload.event_name,
      action_source: payload.action_source,
      event_time: dayjs.utc(payload.event_time).unix(),
      event_id: payload.event_id,
      event_source_url: payload.event_source_url,
      partner_name: PARTNER_NAME,
      opt_out: payload.opt_out,
      user_data: hash_user_data({ user_data: payload.user_data }),
      custom_data: {
        currency: payload?.custom_data?.currency,
        value: String(payload?.custom_data?.value),
        content_ids: payload.custom_data?.content_ids,
        contents: payload.custom_data?.contents,
        num_items: payload.custom_data?.num_items,
        order_id: payload.custom_data?.order_id,
        search_string: payload.custom_data?.search_string,
        opt_out_type: payload.custom_data?.opt_out_type
      },
      app_id: payload.app_id,
      app_name: payload.app_name,
      app_version: payload.app_version,
      device_brand: payload.device_brand,
      device_carrier: payload.device_carrier,
      device_model: payload.device_model,
      device_type: payload.device_type,
      os_version: payload.os_version,
      wifi: payload.wifi,
      language: payload.language
    }
  ]
}

export default action
