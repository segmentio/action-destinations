import { RequestClient } from '@segment/actions-core'
import { Settings } from './generated-types'
import { Payload } from './reportWebEvent/generated-types'
import { formatEmails, formatPhones, formatUserIds, formatString, formatAddress } from './formatter'
import {
  TikTokConversionsAutoProperties,
  TikTokConversionsLeadRequest,
  TikTokConversionsPage,
  TikTokConversionsProperties,
  TikTokConversionsPropertiesMileage,
  TikTokConversionsRequest,
  TikTokConversionsTravelProperties,
  TikTokConversionsUser,
  TikTokLeadData
} from './types'

export function performWebEvent(request: RequestClient, settings: Settings, payload: Payload) {
  const requestUser = validateRequestUser(payload)
  const requestProperties = validateRequestProperties(payload)
  const requestPage = validateRequestPage(payload)
  const requestEventSource = payload.event_source ? payload.event_source.toLowerCase() : 'web'

  if (requestEventSource === 'web') {
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

    // https://business-api.tiktok.com/portal/docs?id=1771101303285761
    return request('https://business-api.tiktok.com/open_api/v1.3/event/track/', {
      method: 'post',
      json: requestJson
    })
  } else {
    const requestJson: TikTokConversionsLeadRequest = {
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
          lead: buildRequestLead(payload),
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
}

function validateRequestUser(payload: Payload): TikTokConversionsUser {
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

function buildBaseRequestProperties(payload: Payload): TikTokConversionsProperties {
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

  return requestProperties
}

function buildTravelRequestProperties(
  payload: Payload,
  baseProperties: TikTokConversionsProperties
): TikTokConversionsTravelProperties {
  const requestProperties: TikTokConversionsTravelProperties = {
    ...baseProperties
  }

  //Travel Parameters
  if (payload.travel_fields?.city) {
    requestProperties.city = payload.travel_fields.city
  }

  if (payload.travel_fields?.region) {
    requestProperties.region = payload.travel_fields.region
  }

  if (payload.travel_fields?.country) {
    requestProperties.country = payload.travel_fields.country
  }

  if (payload.travel_fields?.checkin_date) {
    requestProperties.checkin_date = payload.travel_fields.checkin_date
  }

  if (payload.travel_fields?.checkout_date) {
    requestProperties.checkout_date = payload.travel_fields.checkout_date
  }

  if (payload.travel_fields?.num_adults) {
    requestProperties.num_adults = payload.travel_fields.num_adults
  }

  if (payload.travel_fields?.num_children) {
    requestProperties.num_children = payload.travel_fields.num_children
  }

  if (payload.travel_fields?.num_infants) {
    requestProperties.num_infants = payload.travel_fields.num_infants
  }

  if (payload.travel_fields?.suggested_hotels) {
    requestProperties.suggested_hotels = payload.travel_fields.suggested_hotels
  }

  if (payload.travel_fields?.departing_departure_date) {
    requestProperties.departing_departure_date = payload.travel_fields.departing_departure_date
  }

  if (payload.travel_fields?.returning_departure_date) {
    requestProperties.returning_departure_date = payload.travel_fields.returning_departure_date
  }

  if (payload.travel_fields?.origin_airport) {
    requestProperties.origin_airport = payload.travel_fields.origin_airport
  }

  if (payload.travel_fields?.destination_airiport) {
    requestProperties.destination_airiport = payload.travel_fields.destination_airiport
  }

  if (payload.travel_fields?.destination_ids) {
    requestProperties.destination_ids = payload.travel_fields.destination_ids
  }

  if (payload.travel_fields?.departing_arrival_date) {
    requestProperties.departing_arrival_date = payload.travel_fields.departing_arrival_date
  }

  if (payload.travel_fields?.returning_arrival_date) {
    requestProperties.returning_arrival_date = payload.travel_fields.returning_arrival_date
  }

  if (payload.travel_fields?.travel_class) {
    requestProperties.travel_class = payload.travel_fields.travel_class
  }

  if (payload.travel_fields?.user_score) {
    requestProperties.user_score = payload.travel_fields.user_score
  }

  if (payload.travel_fields?.preferred_num_stops) {
    requestProperties.preferred_num_stops = payload.travel_fields.preferred_num_stops
  }

  if (payload.travel_fields?.travel_start) {
    requestProperties.travel_start = payload.travel_fields.travel_start
  }

  if (payload.travel_fields?.travel_end) {
    requestProperties.travel_end = payload.travel_fields.travel_end
  }

  if (payload.travel_fields?.suggested_destinations) {
    requestProperties.suggested_destinations = payload.travel_fields.suggested_destinations
  }

  return requestProperties
}

function buildAutoRequestProperties(
  payload: Payload,
  baseProperties: TikTokConversionsProperties
): TikTokConversionsAutoProperties {
  const requestProperties: TikTokConversionsAutoProperties = {
    ...baseProperties
  }

  if (payload.auto_fields?.postal_code) {
    requestProperties.postal_code = payload.auto_fields.postal_code
  }

  if (payload.auto_fields?.make) {
    requestProperties.make = payload.auto_fields.make
  }

  if (payload.auto_fields?.model) {
    requestProperties.model = payload.auto_fields.model
  }

  if (payload.auto_fields?.year) {
    requestProperties.year = payload.auto_fields.year
  }

  if (payload.auto_fields?.state_of_vehicle) {
    requestProperties.state_of_vehicle = payload.auto_fields.state_of_vehicle
  }

  if (payload.auto_fields?.mileage_unit && payload.auto_fields?.mileage_value) {
    const requestMileage: TikTokConversionsPropertiesMileage = {}
    requestMileage.unit = payload.auto_fields.mileage_unit
    requestMileage.value = payload.auto_fields.mileage_value
    requestProperties.mileage = requestMileage
  }

  if (payload.auto_fields?.exterior_color) {
    requestProperties.exterior_color = payload.auto_fields.exterior_color
  }

  if (payload.auto_fields?.transmission) {
    requestProperties.transmission = payload.auto_fields.transmission
  }

  if (payload.auto_fields?.body_style) {
    requestProperties.body_style = payload.auto_fields.body_style
  }

  if (payload.auto_fields?.fuel_type) {
    requestProperties.fuel_type = payload.auto_fields.fuel_type
  }

  if (payload.auto_fields?.drivetrain) {
    requestProperties.drivetrain = payload.auto_fields.drivetrain
  }

  if (payload.auto_fields?.preferred_price_range_min && payload.auto_fields?.preferred_price_range_max) {
    requestProperties.preferred_price_range = [
      payload.auto_fields.preferred_price_range_min,
      payload.auto_fields.preferred_price_range_max
    ]
  }

  if (payload.auto_fields?.trim) {
    requestProperties.trim = payload.auto_fields.trim
  }

  if (payload.auto_fields?.vin) {
    requestProperties.vin = payload.auto_fields.vin
  }

  if (payload.auto_fields?.interior_color) {
    requestProperties.interior_color = payload.auto_fields.interior_color
  }

  if (payload.auto_fields?.condition_of_vehicle) {
    requestProperties.condition_of_vehicle = payload.auto_fields.condition_of_vehicle
  }

  if (payload.auto_fields?.viewcontent_type) {
    requestProperties.viewcontent_type = payload.auto_fields.viewcontent_type
  }

  if (payload.auto_fields?.search_type) {
    requestProperties.search_type = payload.auto_fields.search_type
  }

  if (payload.auto_fields?.registration_type) {
    requestProperties.registration_type = payload.auto_fields.registration_type
  }

  return requestProperties
}

function validateRequestProperties(
  payload: Payload
): TikTokConversionsProperties | TikTokConversionsTravelProperties | TikTokConversionsAutoProperties {
  const baseRequestProperties: TikTokConversionsProperties = buildBaseRequestProperties(payload)

  if (payload.event_source === 'web') {
    if (payload.travel_fields) {
      return buildTravelRequestProperties(payload, baseRequestProperties)
    } else if (payload.auto_fields) {
      return buildAutoRequestProperties(payload, baseRequestProperties)
    } else {
      return baseRequestProperties
    }
  } else {
    // CRM event
    return baseRequestProperties
  }
}

function validateRequestPage(payload: Payload): TikTokConversionsPage {
  const requestPage: TikTokConversionsPage = {}

  if (payload.url) {
    requestPage.url = payload.url
  }

  if (payload.referrer) {
    requestPage.referrer = payload.referrer
  }

  return requestPage
}

function buildRequestLead(payload: Payload): TikTokLeadData {
  const requestLeadData: TikTokLeadData = {}

  if (payload.lead_fields?.lead_id) {
    requestLeadData.lead_id = payload.lead_fields.lead_id
  }

  if (payload.lead_fields?.lead_event_source) {
    requestLeadData.lead_event_source = payload.lead_fields.lead_event_source
  }

  return requestLeadData
}
