import { Payload as UserPayload } from './updateUserProfile/generated-types'
import { Payload as EventPayload } from './trackEvent/generated-types'
export const API_BASE = 'https://unification.useinsider.com/api/'
export const UPSERT_ENDPOINT = 'user/v1/upsert'

export interface insiderEvent {
  event_name: string
  timestamp: string
  event_params: { [key: string]: any }
}

export interface upsertUserPayload {
  identifiers: {
    uuid?: string | null | undefined
    custom?: object
  }
  attributes: { [key: string]: any }
  events: insiderEvent[]
}

export function userProfilePayload(data: UserPayload) {
  return {
    users: [
      {
        identifiers: {
          uuid: data.uuid,
          custom: {
            segment_anonymous_id: data.segment_anonymous_id
          }
        },
        attributes: {
          age: data.age,
          birthday: data.birthday,
          email: data.email,
          name: data.firstName,
          gender: data.gender,
          surname: data.lastName,
          phone_number: data.phone,
          city: data.city,
          country: data.country,
          email_optin: data.emailOptin,
          sms_optin: data.smsOptin,
          whatsapp_optin: data.whatsappOptin,
          language: data.language
        }
      }
    ]
  }
}

export function sendTrackEvent(data: EventPayload) {
  const payload: upsertUserPayload = {
    identifiers: {
      uuid: data.uuid,
      custom: {
        segment_anonymous_id: data.segment_anonymous_id
      }
    },
    attributes: {
      custom: {}
    },
    events: []
  }

  const events: Object = {
    Unsubscribed: 'email_unsubscribe',
    'Product List Viewed': 'listing_page_view',
    'Product Viewed': 'product_detail_page_view',
    'Product Added': 'item_added_to_cart',
    'Product Removed': 'item_removed_from_cart',
    'Email Bounced': 'email_bounce',
    'Email Delivered': 'email_delivered',
    'Email Link Clicked': 'email_click',
    'Email Marked as Spam': 'email_spamreport',
    'Email Opened': 'email_open',
    'Application Opened': 'session_start',
    'Push Notification Received': 'push_delivered',
    'Push Notification Tapped': 'push_session',
    'User Registered': 'sign_up_confirmation'
  }
  const defaultAttributes = [
    'email',
    'phone',
    'age',
    'birthday',
    'name',
    'gender',
    'surname',
    'city',
    'country',
    'app_version',
    'idfa',
    'model',
    'last_ip',
    'carrier',
    'os_version',
    'platform',
    'timezone',
    'locale'
  ]
  const defaultEvents = [
    'email_subject',
    'campaign_id',
    'campaign_name',
    'url',
    'product_id',
    'user_agent',
    'taxonomy',
    'name',
    'variant_id',
    'unit_sales_price',
    'unit_price',
    'quantity',
    'product_image_url',
    'event_group_id',
    'referrer'
  ]

  for (const key of Object.keys(data.attributes || {})) {
    const attributeName: string = key.toString().toLowerCase().trim().split(' ').join('_').toString()

    if (defaultAttributes.indexOf(attributeName) > -1 && data.attributes) {
      payload.attributes[attributeName as keyof typeof payload.attributes] = data.attributes[attributeName]
    } else if (data.attributes) {
      payload.attributes.custom[attributeName as keyof typeof payload.attributes.custom] =
        data.attributes[attributeName]
    }
  }

  const name = events[data.name as keyof Object]
    ? events[data.name as keyof Object].toString()
    : data.name.toString().toLowerCase().trim().split(' ').join('_')

  const event: insiderEvent = {
    event_name: name,
    timestamp: data.timestamp.toString(),
    event_params: {
      custom: {}
    }
  }

  for (const key of Object.keys(data.parameters || {})) {
    const parameterName = key.toString().toLowerCase().trim().split(' ').join('_')

    if (parameterName === 'taxonomy' && data.parameters) {
      event.event_params[parameterName] = [data.parameters[parameterName]]
    } else if (defaultEvents.indexOf(parameterName) > -1 && data.parameters) {
      event.event_params[parameterName] = data.parameters[parameterName]
    } else if (data.parameters) {
      event.event_params.custom[parameterName] = data.parameters[parameterName]
    }
  }

  payload.events.push(event)

  return { users: [payload] }
}
