import { RequestClient } from '@segment/actions-core'
import { Settings } from './generated-types'
import { Payload } from './reportWebEvent/generated-types'
import { formatEmails, formatPhones, formatUserIds, formatString, formatAddress } from './formatter'
import {
  TikTokConversionsPage,
  TikTokConversionsProperties,
  TikTokConversionsRequest,
  TikTokConversionsUser
} from './types'

export function performWebEvent(request: RequestClient, settings: Settings, payload: Payload) {
  const requestUser = validateRequestUser(payload)
  const requestProperties = validateRequestProperties(payload)
  const requestPage = validateRequestPage(payload)

  const requestJson: TikTokConversionsRequest = {
    event_source: 'web',
    event_source_id: settings.pixelCode,
    partner_name: 'Segment',
    test_event_code: payload.test_event_code ? payload.test_event_code : undefined,
    data: [
      {
        event: payload.event,
        event_time: payload.timestamp
          ? Math.floor(new Date(payload.timestamp).getTime() / 1000)
          : Math.floor(new Date().getTime() / 1000),
        event_id: payload.event_id ? `${payload.event_id}` : undefined,
        user: requestUser,
        properties: requestProperties,
        page: requestPage,
        limited_data_use: payload.limited_data_use ? payload.limited_data_use : false
      }
    ]
  }

  // https://business-api.tiktok.com/portal/docs?id=1771101303285761
  return request('https://business-api.tiktok.com/open_api/v1.3/event/track/', {
    method: 'post',
    json: requestJson
  })
}

function validateRequestUser(payload: Payload) {
  const phone_numbers = formatPhones(payload.phone_number)
  const emails = formatEmails(payload.email)
  const userIds = formatUserIds(payload.external_id)

  let payloadUrl, urlTtclid
  if (payload.url) {
    try {
      payloadUrl = new URL(payload.url)
    } catch (error) {
      //  invalid url
    }
  }

  if (payloadUrl) urlTtclid = payloadUrl.searchParams.get('ttclid')

  const requestUser: TikTokConversionsUser = {
    external_id: userIds,
    phone: phone_numbers,
    email: emails,
    first_name: formatString(payload.first_name),
    last_name: formatString(payload.last_name),
    city: formatAddress(payload.address?.city),
    state: formatAddress(payload.address?.state),
    country: formatAddress(payload.address?.country),
    zip_code: formatString(payload.address?.zip_code)
  }

  if (payload.ttclid || urlTtclid) {
    requestUser.ttclid = urlTtclid || payload.ttclid
  }

  if (payload.lead_id) {
    requestUser.lead_id = payload.lead_id
  }

  if (payload.ttp) {
    requestUser.ttp = payload.ttp
  }

  if (payload.ip) {
    requestUser.ip = payload.ip
  }

  if (payload.user_agent) {
    requestUser.user_agent = payload.user_agent
  }

  if (payload.locale) {
    requestUser.locale = payload.locale
  }

  return requestUser
}

function validateRequestProperties(payload: Payload) {
  const requestProperties: TikTokConversionsProperties = {
    contents: []
  }

  if (payload.contents) {
    payload.contents.forEach((content) => {
      const contentObj = {
        price: content.price ? content.price : undefined,
        quantity: content.quantity ? content.quantity : undefined,
        content_category: content.content_category ? content.content_category : undefined,
        content_id: content.content_id ? content.content_id : undefined,
        content_name: content.content_name ? content.content_name : undefined,
        brand: content.brand ? content.brand : undefined
      }
      requestProperties.contents.push(contentObj)
    })
  }

  if (payload.content_type) {
    requestProperties.content_type = payload.content_type
  }

  if (payload.currency) {
    requestProperties.currency = payload.currency
  }

  if (payload.value || payload.value === 0) {
    requestProperties.value = payload.value
  }

  if (payload.query) {
    requestProperties.query = payload.query
  }

  if (payload.description) {
    requestProperties.description = payload.description
  }

  if (payload.order_id) {
    requestProperties.order_id = payload.order_id
  }

  if (payload.shop_id) {
    requestProperties.shop_id = payload.shop_id
  }

  return requestProperties
}

function validateRequestPage(payload: Payload) {
  const requestPage: TikTokConversionsPage = {}

  if (payload.url) {
    requestPage.url = payload.url
  }

  if (payload.referrer) {
    requestPage.referrer = payload.referrer
  }

  return requestPage
}
