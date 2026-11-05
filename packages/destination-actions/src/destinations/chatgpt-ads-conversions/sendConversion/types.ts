export type EventType =
  | 'app_installed'
  | 'app_opened'
  | 'appointment_scheduled'
  | 'checkout_started'
  | 'contents_viewed'
  | 'custom'
  | 'items_added'
  | 'lead_created'
  | 'order_created'
  | 'page_viewed'
  | 'registration_completed'
  | 'subscription_created'
  | 'trial_started'

export type DataType = 'contents' | 'customer_action' | 'plan_enrollment' | 'custom'

export type ActionSource = 'web' | 'mobile_app' | 'offline' | 'physical_store' | 'phone_call' | 'email' | 'other'

export interface ContentItemJSON {
  id?: string
  group_id?: string
  name?: string
  content_type?: string
  quantity?: number
  amount?: number
  currency?: string
  variant_dict?: Record<string, string>
}

interface AmountJSON {
  amount?: number
  currency?: string
}

export interface CustomerActionDataJSON extends AmountJSON {
  type: 'customer_action'
}

export interface ContentsDataJSON extends AmountJSON {
  type: 'contents'
  contents?: ContentItemJSON[]
}

export interface PlanEnrollmentDataJSON extends AmountJSON {
  type: 'plan_enrollment'
  plan_id?: string
  contents?: ContentItemJSON[]
}

export interface CustomDataJSON extends AmountJSON {
  type: 'custom'
  plan_id?: string
  contents?: ContentItemJSON[]
}

export type EventDataJSON = CustomerActionDataJSON | ContentsDataJSON | PlanEnrollmentDataJSON | CustomDataJSON

export interface UserJSON {
  emails_sha256?: string[]
  phone_numbers_sha256?: string[]
  external_ids_sha256?: string[]
  first_names_sha256?: string[]
  last_names_sha256?: string[]
  obref?: string
  ip_address?: string
  user_agent?: string
  regions?: string[]
  cities?: string[]
  postal_codes?: string[]
  countries?: string[]
  android_advertising_id?: string
}

export interface EventJSON {
  id: string
  type: EventType
  timestamp_ms: number
  action_source: ActionSource
  custom_event_name?: string
  oppref?: string
  source_url?: string
  opt_out?: boolean
  user: UserJSON
  data: EventDataJSON
}

export interface EventsRequestJSON {
  integration_source: string
  validate_only?: boolean
  events: EventJSON[]
}

export interface EventsResponse {
  accepted_events?: number
}

// Body of a 400/422 event rejection. `errors` has held a single entry in every probe: the first bad
// event found, with a param like "events[2].type", even when several events are invalid. Auth errors
// (401/403) return an `error` without `errors`, and other failures may not be JSON, so all are optional.
export interface EventsErrorResponse {
  error?: {
    message?: string
    code?: string
    errors?: { param?: string; message?: string }[]
  }
}

export interface IndexedEventJSON {
  event: EventJSON
  index: number
}
