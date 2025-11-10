import { RequestClient, PayloadValidationError } from '@segment/actions-core'
import { Payload } from './generated-types'
import { Settings } from '../generated-types'
import { formatEmails, formatPhones, formatUserIds, formatAdvertisingId } from './formatter'
import { TTJSON, TTBaseProps, TTUser, TTApp, TTAd, AppStatus } from './types'
import { APP_STATUS } from './constants'
import { STANDARD_EVENTS, PRODUCT_MAPPING_TYPE } from '../reportAppEvent/fields/common_fields'

export function send(request: RequestClient, payload: Payload, settings: Settings): Promise<unknown> {
  const { event_source, event, event_id, test_event_code, limited_data_use, timestamp } = payload

  const { appID } = settings

  const user = getUser(payload)
  const properties = getProps(payload)
  const app = getApp(payload)
  const ad = getAd(payload)

  const requestJson: TTJSON = {
    event_source,
    event_source_id: appID,
    partner_name: 'Segment',
    ...(test_event_code ? { test_event_code } : {}),
    data: [
      {
        event,
        event_time: timestamp
          ? Math.floor(new Date(timestamp).getTime() / 1000)
          : Math.floor(new Date().getTime() / 1000),
        event_id: event_id || undefined,
        user,
        properties,
        app,
        ad,
        limited_data_use: typeof limited_data_use === 'boolean' ? limited_data_use : false
      }
    ]
  }

  return request('https://business-api.tiktok.com/open_api/v1.3/event/track/', {
    method: 'post',
    json: requestJson
  })
}

function getUser(payload: Payload): TTUser {
  const {
    phone_number,
    email,
    external_id,
    ip,
    user_agent,
    locale,
    device_details: { device_type, device_id } = {}
  } = payload

  const phone_numbers = formatPhones(phone_number)
  const emails = formatEmails(email)
  const userIds = formatUserIds(external_id)
  const attStatus = getATTStatus(payload)
  const advertisingId = getAdvertisingId(payload)

  const requestUser: TTUser = {
    ...(userIds && userIds.length > 0 ? { external_id: userIds } : {}), // Jae to check if external ids are supported with app events
    ...(phone_numbers && phone_numbers.length > 0 ? { phone: phone_numbers } : {}),
    ...(emails && emails.length > 0 ? { email: emails } : {}),
    ...(advertisingId && device_type?.toLocaleLowerCase() === 'ios' ? { idfa: advertisingId } : {}),
    ...(advertisingId && device_type?.toLocaleLowerCase() === 'android' ? { gaid: advertisingId } : {}),
    ...(device_id && device_type?.toLocaleLowerCase() === 'ios' ? { idfv: device_id } : {}),
    ...(attStatus ? { att_status: attStatus } : {}),
    ...(ip ? { ip } : {}),
    ...(user_agent ? { user_agent } : {}),
    ...(locale ? { locale } : {})
  }

  return requestUser
}

function getATTStatus(payload: Payload): AppStatus {
  const { att_status, device_details: { device_type, device_version, ad_tracking_enabled } = {} } = payload

  if (att_status === 'AUTO') {
    if (device_type?.toLocaleLowerCase() !== 'ios') {
      return APP_STATUS.NOT_APPLICABLE
    } else {
      if (device_version && isVersionLower(device_version, '14.0.0')) {
        return APP_STATUS.NOT_APPLICABLE
      }
    }
    if (typeof ad_tracking_enabled === 'boolean') {
      return ad_tracking_enabled ? APP_STATUS.AUTHORIZED : APP_STATUS.DENIED
    }
    return APP_STATUS.NOT_DETERMINED
  } else {
    return att_status as AppStatus
  }
}

function getAdvertisingId(payload: Payload): string | undefined {
  const { advertising_id, device_details: { device_type } = {} } = payload

  if (!advertising_id || !device_type) {
    return undefined
  }

  const platform = device_type.toLocaleLowerCase()

  if (platform === 'ios') {
    return formatAdvertisingId(advertising_id, true)
  }

  if (platform === 'android') {
    return formatAdvertisingId(advertising_id, false)
  }

  return undefined
}

function getProps(payload: Payload): TTBaseProps {
  const { event, content_type, currency, value, description, content_ids, num_items, search_string, contents } = payload

  const productMappingType = STANDARD_EVENTS.find((se) => se.ttEventName === event)?.productMappingType

  if (
    productMappingType &&
    (productMappingType === PRODUCT_MAPPING_TYPE.SINGLE || productMappingType === PRODUCT_MAPPING_TYPE.MULTIPLE)
  ) {
    contents?.forEach((content) => {
      if (!content.content_id) {
        throw new PayloadValidationError(`content_id is required for event ${event}`)
      }
    })
  }

  const requestProperties: TTBaseProps = {
    contents: contents
      ? contents.map(({ price, quantity, content_category, content_id, content_name, brand }) => ({
          ...(price ? { price } : {}),
          ...(typeof quantity === 'number' ? { quantity } : {}),
          ...(content_category ? { content_category } : {}),
          ...(content_id ? { content_id } : {}),
          ...(content_name ? { content_name } : {}),
          ...(brand ? { brand } : {})
        }))
      : [],
    ...(content_type !== undefined && { content_type }),
    ...(currency !== undefined && { currency }),
    ...(value !== undefined && { value }),
    ...(description !== undefined && { description }),
    ...(content_ids !== undefined && { content_ids }),
    ...(num_items !== undefined && { num_items }),
    ...(search_string !== undefined && { search_string })
  }

  return requestProperties
}

function getApp(payload: Payload): TTApp {
  const { app_id, app_name, app_version } = payload.app || {}

  const app: TTApp = {
    app_id,
    ...(app_name ? { app_name } : {}),
    ...(app_version ? { app_version } : {})
  }

  return app
}

function getAd(payload: Payload): TTAd {
  const {
    callback,
    campaign_id,
    ad_id,
    creative_id,
    is_retargeting,
    attributed,
    attribution_type,
    attribution_provider
  } = payload.ad || {}

  const ad: TTAd = {
    ...(callback ? { callback } : {}),
    ...(campaign_id ? { campaign_id } : {}),
    ...(ad_id ? { ad_id } : {}),
    ...(creative_id ? { creative_id } : {}),
    ...(typeof is_retargeting === 'boolean' ? { is_retargeting } : {}),
    ...(typeof attributed === 'boolean' ? { attributed } : {}),
    ...(attribution_type ? { attribution_type } : {}),
    ...(attribution_provider ? { attribution_provider } : {})
  }

  return ad
}

function isVersionLower(version: string, target = '14.0.0') {
  const [a1 = 0, a2 = 0, a3 = 0] = version.split('.').map(Number)
  const [b1 = 0, b2 = 0, b3 = 0] = target.split('.').map(Number)
  return a1 < b1 || (a1 === b1 && a2 < b2) || (a1 === b1 && a2 === b2 && a3 < b3)
}
