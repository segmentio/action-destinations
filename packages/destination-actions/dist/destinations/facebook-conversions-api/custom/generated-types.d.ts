export interface Payload {
  action_source: string
  event_name: string
  event_time: string
  user_data: {
    externalId?: string
    email?: string
    phone?: string
    gender?: string
    dateOfBirth?: string
    lastName?: string
    firstName?: string
    city?: string
    state?: string
    zip?: string
    country?: string
    client_ip_address?: string
    client_user_agent?: string
    fbc?: string
    fbp?: string
    subscriptionID?: string
    leadID?: number
    fbLoginID?: number
  }
  custom_data?: {
    [k: string]: unknown
  }
  event_id?: string
  event_source_url?: string
}
