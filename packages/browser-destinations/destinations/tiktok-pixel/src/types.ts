export interface TikTokPixel {
  page: () => void
  instance: (pixel_code: string) => TikTokPixel
  identify: ({
    email,
    phone_number,
    external_id,
    first_name,
    last_name,
    city,
    state,
    country,
    zip_code
  }: TTUser) => void
  track: (
    event: string,
    {
      contents,
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
      destination_airiport,
      destination_ids,
      departing_arrival_date,
      returning_arrival_date,
      travel_class,
      user_score,
      preferred_num_stops,
      travel_start,
      travel_end,
      suggested_destinations,
      postal_code,
      make,
      model,
      year,
      state_of_vehicle,
      mileage,
      exterior_color,
      transmission,
      body_style,
      fuel_type,
      drivetrain,
      preferred_price_range,
      trim,
      vin,
      interior_color,
      condition_of_vehicle,
      viewcontent_type,
      search_type,
      registration_type
    }: TTBaseProps & TTTravelProps & TTAutoProps,
    {
      event_id
    }: {
      event_id: string | undefined
    }
  ) => void
}

export interface TTUser {
  external_id: string
  phone_number: string | undefined
  email: string
  locale?: string
  first_name?: string
  last_name?: string
  city?: string
  state?: string
  country?: string
  zip_code?: string
}

export interface TTBaseProps {
  contents: TTContentItem[]
  content_type?: string
  currency?: string
  value?: number
  query?: string
  description?: string
  order_id?: string
  shop_id?: string
  content_ids?: string[]
  num_items?: number
  search_string?: string
}

export interface TTTravelProps {
  city?: string
  region?: string
  country?: string
  checkin_date?: string
  checkout_date?: string
  num_adults?: number
  num_children?: number
  num_infants?: number
  suggested_hotels?: string[]
  departing_departure_date?: string
  returning_departure_date?: string
  origin_airport?: string
  destination_airiport?: string
  destination_ids?: string[]
  departing_arrival_date?: string
  returning_arrival_date?: string
  travel_class?: string
  user_score?: number
  preferred_num_stops?: number
  travel_start?: string
  travel_end?: string
  suggested_destinations?: string[]
}

export interface TTAutoProps {
  postal_code?: string
  make?: string
  model?: string
  year?: number
  state_of_vehicle?: string
  mileage?: {
    value?: number
    unit?: string
  }
  exterior_color?: string
  transmission?: string
  body_style?: string
  fuel_type?: string
  drivetrain?: string
  preferred_price_range?: number[]
  trim?: string
  vin?: string
  interior_color?: string
  condition_of_vehicle?: string
  viewcontent_type?: string
  search_type?: string
  registration_type?: string
}

interface TTContentItem {
  price?: number
  quantity?: number
  content_category?: string
  content_id?: string
  content_name?: string
  brand?: string
}
