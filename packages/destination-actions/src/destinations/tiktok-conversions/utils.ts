import { RequestClient } from '@segment/actions-core'
import { Settings } from './generated-types'
import { Payload } from './reportWebEvent/generated-types'
import { formatEmails, formatPhones, formatUserIds, formatString, formatAddress } from './formatter'
import {
  TikTokConversionsPage,
  TikTokConversionsProperties,
  TikTokConversionsPropertiesMileage,
  TikTokConversionsRequest,
  TikTokConversionsUser,
  TikTokLeadData
} from './types'

export function performWebEvent(request: RequestClient, settings: Settings, payload: Payload) {
  const requestUser = validateRequestUser(payload)
  const requestProperties = validateRequestProperties(payload)
  const requestPage = validateRequestPage(payload)
  const requestLead = validateRequestLead(payload)
  const requestEventSource = settings.eventSource

  const requestJson: TikTokConversionsRequest = {
    event_source: requestEventSource,
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

  // CRM Lead Params
  if (requestEventSource === 'crm') {
    requestJson.data[0].lead = requestLead
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

  // if (payload.lead_id) {
  //   requestUser.lead_id = payload.lead_id
  // }

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

  // General Parameters
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

  if (payload.content_ids) {
    requestProperties.content_ids = payload.content_ids
  }

  if (payload.delivery_category) {
    requestProperties.delivery_category = payload.delivery_category
  }

  if (payload.num_items) {
    requestProperties.num_items = payload.num_items
  }

  if (payload.predicted_ltv) {
    requestProperties.predicted_ltv = payload.predicted_ltv
  }

  if (payload.search_string) {
    requestProperties.search_string = payload.search_string
  }

  //Travel Parameters
  if (payload.city) {
    requestProperties.city = payload.city
  }

  if (payload.region) {
    requestProperties.region = payload.region
  }

  if (payload.country) {
    requestProperties.country = payload.country
  }

  if (payload.checkin_date) {
    requestProperties.checkin_date = payload.checkin_date
  }

  if (payload.checkout_date) {
    requestProperties.checkout_date = payload.checkout_date
  }

  if (payload.num_adults) {
    requestProperties.num_adults = payload.num_adults
  }

  if (payload.num_children) {
    requestProperties.num_children = payload.num_children
  }

  if (payload.num_infants) {
    requestProperties.num_infants = payload.num_infants
  }

  if (payload.suggested_hotels) {
    requestProperties.suggested_hotels = payload.suggested_hotels
  }

  if (payload.departing_departure_date) {
    requestProperties.departing_departure_date = payload.departing_departure_date
  }

  if (payload.returning_departure_date) {
    requestProperties.returning_departure_date = payload.returning_departure_date
  }

  if (payload.origin_airport) {
    requestProperties.origin_airport = payload.origin_airport
  }

  if (payload.destination_airiport) {
    requestProperties.destination_airiport = payload.destination_airiport
  }

  if (payload.destination_ids) {
    requestProperties.destination_ids = payload.destination_ids
  }

  if (payload.departing_arrival_date) {
    requestProperties.departing_arrival_date = payload.departing_arrival_date
  }

  if (payload.returning_arrival_date) {
    requestProperties.returning_arrival_date = payload.returning_arrival_date
  }

  if (payload.travel_class) {
    requestProperties.travel_class = payload.travel_class
  }

  if (payload.user_score) {
    requestProperties.user_score = payload.user_score
  }

  if (payload.preferred_num_stops) {
    requestProperties.preferred_num_stops = payload.preferred_num_stops
  }

  if (payload.travel_start) {
    requestProperties.travel_start = payload.travel_start
  }

  if (payload.travel_end) {
    requestProperties.travel_end = payload.travel_end
  }

  if (payload.suggested_destinations) {
    requestProperties.suggested_destinations = payload.suggested_destinations
  }

  // Auto Params
  if (payload.postal_code) {
    requestProperties.postal_code = payload.postal_code
  }

  if (payload.make) {
    requestProperties.make = payload.make
  }

  if (payload.model) {
    requestProperties.model = payload.model
  }

  if (payload.year) {
    requestProperties.year = payload.year
  }

  if (payload.state_of_vehicle) {
    requestProperties.state_of_vehicle = payload.state_of_vehicle
  }

  if (payload.mileage && payload.mileage.unit && payload.mileage.value) {
    const requestMileage: TikTokConversionsPropertiesMileage = {}
    requestMileage.unit = payload.mileage.unit
    requestMileage.value = payload.mileage.value
    requestProperties.mileage = requestMileage
  }

  if (payload.exterior_color) {
    requestProperties.exterior_color = payload.exterior_color
  }

  if (payload.transmission) {
    requestProperties.transmission = payload.transmission
  }

  if (payload.body_style) {
    requestProperties.body_style = payload.body_style
  }

  if (payload.fuel_type) {
    requestProperties.fuel_type = payload.fuel_type
  }

  if (payload.drivetrain) {
    requestProperties.drivetrain = payload.drivetrain
  }

  if (payload.preferred_price_range && payload.preferred_price_range.min && payload.preferred_price_range.max) {
    requestProperties.preferred_price_range = [payload.preferred_price_range.min, payload.preferred_price_range.max]
  }

  if (payload.trim) {
    requestProperties.trim = payload.trim
  }

  if (payload.vin) {
    requestProperties.vin = payload.vin
  }

  if (payload.interior_color) {
    requestProperties.interior_color = payload.interior_color
  }

  if (payload.condition_of_vehicle) {
    requestProperties.condition_of_vehicle = payload.condition_of_vehicle
  }

  if (payload.viewcontent_type) {
    requestProperties.viewcontent_type
  }

  if (payload.search_type) {
    requestProperties.search_type = payload.search_type
  }

  if (payload.registration_type) {
    requestProperties.registration_type = payload.registration_type
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

function validateRequestLead(payload: Payload) {
  const requestLeadData: TikTokLeadData = {}

  if (payload.lead_id) {
    requestLeadData.lead_id = payload.lead_id
  }

  if (payload.lead_event_source) {
    requestLeadData.lead_event_source = payload.lead_event_source
  }

  return requestLeadData
}
