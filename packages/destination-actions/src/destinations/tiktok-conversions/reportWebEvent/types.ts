export interface TTJSON {
  event_source: string
  event_source_id: string
  partner_name: string
  test_event_code?: string
  data: TTDataItem[]
}
interface TTDataItem {
  event: string
  event_time: number
  event_id?: string
  user: TTUser
  properties: TTBaseProps & TTTravelProps & TTAutoProps
  page?: {
    url?: string
    referrer?: string
  }
  limited_data_use: boolean
  lead?: {
    lead_id: string
    lead_event_source?: string
  }
}

export interface TTUser {
  external_id: string[]
  phone: string[]
  email: string[]
  ttp?: string
  ip?: string
  user_agent?: string
  locale?: string
  first_name?: string
  last_name?: string
  city?: string
  state?: string
  country?: string
  zip_code?: string
  ttclid?: string
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
  delivery_category?: string
  num_items?: number
  predicted_ltv?: number
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
