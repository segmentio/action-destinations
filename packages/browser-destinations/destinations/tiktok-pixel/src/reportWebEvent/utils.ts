import { Payload } from './generated-types'
import { TTBaseProps, TTTravelProps, TTAutoProps } from '../types'
import { TRAVEL_FIELDS, VEHICLE_FIELDS } from './constants'

export function getAllProperties(payload: Payload): TTBaseProps & TTAutoProps & TTTravelProps {
  const { event_spec_type } = payload

  return {
    ...getProps(payload),
    ...(event_spec_type === TRAVEL_FIELDS ? getTravelProps(payload) : {}),
    ...(event_spec_type === VEHICLE_FIELDS ? getAutoProp(payload) : {})
  }
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
    ...(query !== undefined && { query }),
    ...(description !== undefined && { description }),
    ...(order_id !== undefined && { order_id }),
    ...(shop_id !== undefined && { shop_id }),
    ...(content_ids !== undefined && { content_ids }),
    ...(num_items !== undefined && { num_items }),
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
    suggested_destinations
  } = payload?.travel_fields ?? {}

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
    ...(suggested_destinations !== undefined && { suggested_destinations })
  }

  return requestProperties
}

function getAutoProp(payload: Payload): TTAutoProps {
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
  } = payload?.vehicle_fields ?? {}

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
    ...(mileage_unit !== undefined &&
      typeof mileage_value === 'number' && {
        mileage: {
          unit: mileage_unit,
          value: mileage_value
        }
      }),
    ...(typeof preferred_price_range_min === 'number' &&
      typeof preferred_price_range_max === 'number' && {
        preferred_price_range: [preferred_price_range_min, preferred_price_range_max]
      })
  }

  return requestProperties
}
