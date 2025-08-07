import { RequestClient } from '@segment/actions-core'
import { Settings } from '../generated-types'
import { Payload } from './generated-types'
import { formatEmails, formatPhones, formatUserIds, formatString, formatAddress } from './formatter'
import { WEB, CRM, TRAVEL_FIELDS, VEHICLE_FIELDS } from './constants'
import {
  TTJSON,
  TTAutoProps,
  TTBaseProps,
  TTTravelProps,
  TTUser
} from './types'

export function send(request: RequestClient, settings: Settings, payload: Payload) {
  const { 
    event, 
    event_id, 
    event_spec_type, 
    test_event_code, 
    url, 
    referrer, 
    limited_data_use,
    lead_fields: { 
      lead_id, 
      lead_event_source 
    } = {} } = payload

  const user = getUser(payload)
  const properties = getProps(payload)
  const event_source = payload.event_source ?? WEB

  const requestJson: TTJSON = {
    event_source: event_source ? event_source : WEB,
    event_source_id: settings.pixelCode,
    partner_name: 'Segment',
    test_event_code: test_event_code ? test_event_code : undefined,
    data: [
      {
        event,
        event_time: payload.timestamp
          ? Math.floor(new Date(payload.timestamp).getTime() / 1000)
          : Math.floor(new Date().getTime() / 1000),
        event_id: event_id ? `${event_id}` : undefined,
        user,
        properties: {
          ...properties,
          ...(event_spec_type === TRAVEL_FIELDS && event_source === WEB ? getTravelProps(payload) : {}),
          ...(event_spec_type === VEHICLE_FIELDS && event_source === WEB ? getAutoProps(payload) : {})
        },
        ...((url || referrer) ? { page: { ...(url && { url }), ...(referrer && { referrer }) } } : {}),
        ...(event_source === CRM && typeof lead_id === 'string'
          ? {
              lead: {
                lead_id,
                ...(lead_event_source && { lead_event_source })
              }
            }
          : {}),
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
    url,
    first_name,
    last_name,
    address,
    ttclid,
    ttp,
    ip,
    user_agent,
    locale
  } = payload
  
  const phone_numbers = formatPhones(phone_number)
  const emails = formatEmails(email)
  const userIds = formatUserIds(external_id)

  let payloadUrl, urlTtclid
  if (url) {
    try {
      payloadUrl = new URL(url)
    } catch (error) {
      //  invalid url
    }
  }

  if (payloadUrl) urlTtclid = payloadUrl.searchParams.get('ttclid')

  const requestUser: TTUser = {
    external_id: userIds,
    phone: phone_numbers,
    email: emails,
    first_name: formatString(first_name),
    last_name: formatString(last_name),
    city: formatAddress(address?.city),
    state: formatAddress(address?.state),
    country: formatAddress(address?.country),
    zip_code: formatString(address?.zip_code),
    ...(ttclid || urlTtclid ? { ttclid: urlTtclid ?? ttclid } : {}),
    ...(ttp ? { ttp } : {}),
    ...(ip ? { ip } : {}),
    ...(user_agent ? { user_agent } : {}),
    ...(locale ? { locale } : {})
  }

  return requestUser
}

function getProps(payload: Payload): TTBaseProps {
  const {
    content_type,
    currency,
    value,
    query,
    description,
    order_id,
    shop_id,
    content_ids,
    delivery_category,
    num_items,
    predicted_ltv,
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
          brand: brand ?? undefined,
        }))
      : [],
    ...(content_type !== undefined && { content_type }),
    ...(currency !== undefined && { currency }),
    ...(value !== undefined && { value }),
    ...(query !== undefined && { query }),
    ...(description !== undefined && { description }),
    ...(order_id !== undefined && { order_id }),
    ...(shop_id !== undefined && { shop_id }),
    ...(content_ids !== undefined && { content_ids }),
    ...(delivery_category !== undefined && { delivery_category }),
    ...(num_items !== undefined && { num_items }),
    ...(predicted_ltv !== undefined && { predicted_ltv }),
    ...(search_string !== undefined && { search_string })
  }

  return requestProperties
}

function getTravelProps(payload: Payload): TTTravelProps {
  const {
    city,
    region,
    country,
    checkin_date,
    checkout_date,
    num_adults,
    num_children,
    num_infants,
    suggested_hotels,
    departing_departure_date,
    returning_departure_date,
    origin_airport,
    destination_airport,
    destination_ids,
    departing_arrival_date,
    returning_arrival_date,
    travel_class,
    user_score,
    preferred_num_stops,
    travel_start,
    travel_end,
    suggested_destinations,
  } = payload?.travelFields ?? {}

  const requestProperties: TTTravelProps = {
    ...(city !== undefined && { city }),
    ...(region !== undefined && { region }),
    ...(country !== undefined && { country }),
    ...(checkin_date !== undefined && { checkin_date }),
    ...(checkout_date !== undefined && { checkout_date }),
    ...(num_adults !== undefined && { num_adults }),
    ...(num_children !== undefined && { num_children }),
    ...(num_infants !== undefined && { num_infants }),
    ...(suggested_hotels !== undefined && { suggested_hotels }),
    ...(departing_departure_date !== undefined && { departing_departure_date }),
    ...(returning_departure_date !== undefined && { returning_departure_date }),
    ...(origin_airport !== undefined && { origin_airport }),
    ...(destination_airport !== undefined && { destination_airport }),
    ...(destination_ids !== undefined && { destination_ids }),
    ...(departing_arrival_date !== undefined && { departing_arrival_date }),
    ...(returning_arrival_date !== undefined && { returning_arrival_date }),
    ...(travel_class !== undefined && { travel_class }),
    ...(user_score !== undefined && { user_score }),
    ...(preferred_num_stops !== undefined && { preferred_num_stops }),
    ...(travel_start !== undefined && { travel_start }),
    ...(travel_end !== undefined && { travel_end }),
    ...(suggested_destinations !== undefined && { suggested_destinations }),
  }

  return requestProperties
}

function getAutoProps(payload: Payload): TTAutoProps {
  const {
    postal_code,
    make,
    model,
    year,
    state_of_vehicle,
    mileage_unit,
    mileage_value,
    exterior_color,
    transmission,
    body_style,
    fuel_type,
    drivetrain,
    preferred_price_range_min,
    preferred_price_range_max,
    trim,
    vin,
    interior_color,
    condition_of_vehicle,
    viewcontent_type,
    search_type,
    registration_type
  } = payload?.autoFields ?? {}

  const requestProperties: TTAutoProps = {
    ...(postal_code !== undefined && { postal_code }),
    ...(make !== undefined && { make }),
    ...(model !== undefined && { model }),
    ...(year !== undefined && { year }),
    ...(state_of_vehicle !== undefined && { state_of_vehicle }),
    ...(exterior_color !== undefined && { exterior_color }),
    ...(transmission !== undefined && { transmission }),
    ...(body_style !== undefined && { body_style }),
    ...(fuel_type !== undefined && { fuel_type }),
    ...(drivetrain !== undefined && { drivetrain }),
    ...(trim !== undefined && { trim }),
    ...(vin !== undefined && { vin }),
    ...(interior_color !== undefined && { interior_color }),
    ...(condition_of_vehicle !== undefined && { condition_of_vehicle }),
    ...(viewcontent_type !== undefined && { viewcontent_type }),
    ...(search_type !== undefined && { search_type }),
    ...(registration_type !== undefined && { registration_type }),
    ...(mileage_unit !== undefined && typeof mileage_value === 'number' && {
      mileage: {
        unit: mileage_unit,
        value: mileage_value
      }
    }),
    ...(typeof preferred_price_range_min === 'number' && typeof preferred_price_range_max === 'number' && {
      preferred_price_range: [preferred_price_range_min, preferred_price_range_max]
    })
  }  

  return requestProperties
}