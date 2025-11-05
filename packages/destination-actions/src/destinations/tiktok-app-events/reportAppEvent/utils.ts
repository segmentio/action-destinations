import { RequestClient } from '@segment/actions-core'
import { Payload } from './generated-types'
import { formatEmails, formatPhones, formatUserIds, formatIDFA } from './formatter'
import { TTJSON, TTBaseProps, TTUser, TTApp, TTAd, AppStatus } from './types'

export function send(request: RequestClient, payload: Payload) {
  const {
    event_source,
    tiktok_app_id,
    event,
    event_id,
    test_event_code,
    limited_data_use,
    timestamp
  } = payload

  const user = getUser(payload)
  const properties = getProps(payload)
  const app = getApp(payload)
  const ad = getAd(payload)
 
  const requestJson: TTJSON = {
    event_source,
    event_source_id: tiktok_app_id,
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
    device_details: {
      device_type,
      device_id
    } = {}
  } = payload

  const phone_numbers = formatPhones(phone_number)
  const emails = formatEmails(email)
  const userIds = formatUserIds(external_id)  
  const attStatus = getATTStatus(payload)
  const gaid = getGAID(payload)
  const idfa = getIDFA(payload)

  const requestUser: TTUser = {
    ...(userIds && userIds.length > 0 ? { external_id: userIds } : {}), // Jae to check if external ids are supported with app events
    ...(phone_numbers && phone_numbers.length > 0 ? { phone: phone_numbers } : {}),
    ...(emails && emails.length > 0 ? { email: emails } : {}),
    ...(idfa ? { idfa } : {}),
    ...(gaid ? { gaid } : {}),
    ...(device_id && device_type === 'iOS' ? { idfv: device_id } : {}),
    ...(attStatus ? { att_status: attStatus } : {}),
    ...(ip ? { ip } : {}),
    ...(user_agent ? { user_agent } : {}),
    ...(locale ? { locale } : {})
  }

  return requestUser
}

function getIDFA(payload: Payload): string | undefined {
  const { 
    advertising_id,
    device_details: {
      device_type
    } = {}
  } = payload

  if(device_type === 'iOS' && advertising_id) {
    return formatIDFA(advertising_id)
  }

  return undefined
}

function getGAID(payload: Payload): string | undefined {
  const { 
    advertising_id,
    device_details: {
      device_type
    } = {}
  } = payload

  if(device_type === 'Android' && advertising_id) {
    return advertising_id.toLocaleLowerCase().trim()
  }

  return undefined
}

function getProps(payload: Payload): TTBaseProps {
  const {
    content_type,
    currency,
    value,
    description,
    content_ids,
    num_items,
    search_string,
    contents
  } = payload

  const requestProperties: TTBaseProps = {
    contents: contents
      ? contents.map(({ price, quantity, content_category, content_id, content_name, brand }) => ({
          price: price ?? undefined,
          quantity: quantity ?? undefined,
          content_category: content_category ?? undefined,
          content_id: content_id ?? undefined,
          content_name: content_name ?? undefined,
          brand: brand ?? undefined
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

function getATTStatus(payload: Payload): AppStatus {
  const { 
    att_status, 
    device_details: {
      device_type,
      device_version,
      ad_tracking_enabled
    } = {}
  } = payload

  if(att_status === 'AUTO') {
    if(device_type !== 'iOS') {
      return 'NOT_APPLICABLE'
    } 
    else {
      if(device_version && isVersionLower(device_version, '14.0.0')) {
        return 'NOT_APPLICABLE'      
      }
    }
    if(typeof ad_tracking_enabled === 'boolean') {
      return ad_tracking_enabled ? 'AUTHORIZED' : 'DENIED'
    }
    return 'NOT_DETERMINED'
  }
  else {
    return att_status as AppStatus
  }
}

function getApp(payload: Payload): TTApp {
  const { 
    app_id, 
    app_name, 
    app_version 
  } = payload.app || {}

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

function isVersionLower(version: string, target = "14.0.0") {
  const [a1=0, a2=0, a3=0] = version.split('.').map(Number)
  const [b1=0, b2=0, b3=0] = target.split('.').map(Number)
  return a1 < b1 || (a1 === b1 && a2 < b2) || (a1 === b1 && a2 === b2 && a3 < b3)
}