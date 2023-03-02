import { Payload as UserPayload } from './updateUserProfile/generated-types'
import { Payload as EventPayload } from './trackEvent/generated-types'
export const API_BASE = 'https://unification.useinsider.com/api/'
export const UPSERT_ENDPOINT = 'user/v1/upsert'

export interface insiderEvent extends Object {
  event_name: string
  timestamp: string
  event_params: {
    custom: object
  }
}

export interface upsertUserPayload extends Object {
  identifiers: {
    uuid: string
    custom?: object
  }
  attributes: {
    custom: object
  }
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
    'Product List Viewed': 'listing_page_view',
    'Product Viewed': 'product_detail_page_view',
    'Product Added': 'item_added_to_cart',
    'Product Removed': 'item_removed_from_cart',
    'Email Bounced': 'email_bounce',
    'Email Delivered': 'email_delivered',
    'Email Link Clicked': 'email_click',
    'Email Marked as Spam': 'email_spamreport',
    'Email Opened': 'email_open',
    Unsubscribed: 'email_unsubscribe',
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
    'ta',
    'na',
    'variant_id',
    'usp',
    'up',
    'qu',
    'piu',
    'e_quid',
    'referrer'
  ]

  const name = events[data.name as keyof Object]
    ? events[data.name as keyof Object]
    : data.name.toLowerCase().trim().split(' ').join('_')

  ;(Object.keys(data.attributes) as (keyof typeof data.attributes)[]).forEach((key) => {
    const attributeName = key.toString().toLowerCase().trim().split(' ').join('_')

    if (defaultAttributes.indexOf(attributeName) > -1) {
      payload.attributes[attributeName as keyof Object] = data.attributes[attributeName]
    } else {
      payload.attributes.custom[attributeName as keyof Object] = data.attributes[attributeName]
    }
  })

  const event: insiderEvent = {
    event_name: name,
    timestamp: data.timestamp,
    event_params: {
      custom: {}
    }
  }

  ;(Object.keys(data.parameters) as (keyof typeof data.parameters)[]).forEach((key) => {
    const parameterName = key.toString().toLowerCase().trim().split(' ').join('_')

    if (defaultEvents.indexOf(parameterName) > -1) {
      event.event_params[parameterName as keyof Object] = data.parameters[parameterName]
    } else {
      event.event_params.custom[parameterName as keyof Object] = data.parameters[parameterName]
    }
  })

  payload.events.push(event)

  return { users: [payload] }
}
