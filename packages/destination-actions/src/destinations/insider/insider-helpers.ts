import { Payload as UserPayload } from './updateUserProfile/generated-types'
import { Payload as TrackEventPayload } from './trackEvent/generated-types'
import { Payload as CartViewedEventPayload } from './cartViewedEvent/generated-types'
import { Payload as CheckoutEventPayload } from './checkoutEvent/generated-types'
import { Payload as OrderCompletedEventPayload } from './orderCompletedEvent/generated-types'
import { Payload as ProductAddedEventPayload } from './productAddedEvent/generated-types'
import { Payload as ProductListViewedEventPayload } from './productListViewedEvent/generated-types'
import { Payload as productRemovedEventPayload } from './productRemovedEvent/generated-types'
import { Payload as productViewedEventPayload } from './productViewedEvent/generated-types'
import { Payload as userRegisteredEventPayload } from './userRegisteredEvent/generated-types'

export const API_BASE = 'https://unification.useinsider.com/api/'
export const UPSERT_ENDPOINT = 'user/v1/upsert'

export interface insiderEvent {
  event_name: string
  timestamp: string
  event_params: { [key: string]: string | number | boolean }
}

export interface upsertUserPayload {
  identifiers: {
    uuid?: string | null | undefined
    custom?: object
  }
  attributes: { [key: string]: never }
  events: insiderEvent[]
}

export function userProfilePayload(data: UserPayload) {
  const identifiers = {
    uuid: data.uuid,
    custom: {
      segment_anonymous_id: data.segment_anonymous_id
    }
  }

  if (data.email_as_identifier) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    identifiers['email'] = data.email
  }

  if (data.phone_number_as_identifier) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    identifiers['phone_number'] = data.phone
  }

  return {
    users: [
      {
        identifiers,
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
          gdpr_optin: data.gdprOptin,
          email_optin: data.emailOptin,
          sms_optin: data.smsOptin,
          whatsapp_optin: data.whatsappOptin,
          language: data.language?.replace('-', '_'),
          custom: data.custom
        }
      }
    ]
  }
}

export function sendTrackEvent(
  data:
    | TrackEventPayload
    | CartViewedEventPayload
    | CheckoutEventPayload
    | OrderCompletedEventPayload
    | ProductAddedEventPayload
    | ProductListViewedEventPayload
    | productRemovedEventPayload
    | productViewedEventPayload
    | userRegisteredEventPayload,
  event_name: string
) {
  const addEventParameters = function (
    event: insiderEvent,
    data:
      | {
          url?: string
          product_id?: string
          taxonomy?: string
          name?: string
          currency?: string
          variant_id?: number
          unit_sale_price?: number
          unit_price?: number
          quantity?: number
          product_image_url?: string
          event_group_id?: string
          referrer?: string
          user_agent?: string
          [p: string]: unknown
        }
      | undefined,
    parameter: string
  ) {
    parameter = parameter.toString().toLowerCase().trim().split(' ').join('_')

    if (parameter === 'taxonomy') {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      event.event_params[parameter] = [data[parameter]]
    } else if (defaultEvents.indexOf(parameter) > -1) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      event.event_params[parameter] = data[parameter]
    } else if (data) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      event.event_params.custom[parameter] = data[parameter]
    }

    return event
  }

  const identifiers = {
    uuid: data.uuid,
    custom: {
      segment_anonymous_id: data.segment_anonymous_id
    }
  }

  if (data.email_as_identifier && data?.attributes?.email) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    identifiers['email'] = data?.attributes?.email
  }

  if (data.phone_number_as_identifier && data?.attributes?.phone) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    identifiers['phone_number'] = data?.attributes?.phone
  }

  const payload: upsertUserPayload = {
    identifiers,
    attributes: {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      custom: {}
    },
    events: []
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
    'campaign_id',
    'campaign_name',
    'url',
    'product_id',
    'user_agent',
    'taxonomy',
    'name',
    'variant_id',
    'unit_sale_price',
    'unit_price',
    'quantity',
    'product_image_url',
    'event_group_id',
    'referrer',
    'currency'
  ]

  for (const key of Object.keys(data.attributes || {})) {
    const attributeName: string = key.toString().toLowerCase().trim().split(' ').join('_').toString()

    if (attributeName === 'locale' && data.attributes) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      payload.attributes[attributeName as keyof typeof payload.attributes] = data.attributes[attributeName]
        ?.split('-')
        .join('_')
    } else if (defaultAttributes.indexOf(attributeName) > -1 && data.attributes) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      payload.attributes[attributeName as keyof typeof payload.attributes] = data.attributes[attributeName]
    } else if (data.attributes) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      payload.attributes.custom[attributeName as keyof typeof payload.attributes.custom] =
        data.attributes[attributeName]
    }
  }

  let event: insiderEvent = {
    event_name,
    timestamp: data.timestamp.toString(),
    event_params: {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      custom: {}
    }
  }

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  for (const key of Object.keys(data.parameters || {})) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    event = addEventParameters(event, data.parameters, key)
  }

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  if (data.products) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    for (const product of data.products) {
      let productEvent = event

      for (const key of Object.keys(product || {})) {
        productEvent = addEventParameters(productEvent, product, key)
      }

      payload.events.push(productEvent)
    }
  } else {
    payload.events.push(event)
  }

  return { users: [payload] }
}

export function bulkUserProfilePayload(data: UserPayload[]) {
  const batchPayload = data.map((userPayload) => {
    const identifiers = {
      uuid: userPayload.uuid,
      custom: {
        segment_anonymous_id: userPayload.segment_anonymous_id
      }
    }

    if (userPayload.email_as_identifier) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      identifiers['email'] = userPayload.email
    }

    if (userPayload.phone_number_as_identifier) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      identifiers['phone_number'] = userPayload.phone
    }

    const attributes = {
      age: userPayload.age,
      birthday: userPayload.birthday,
      email: userPayload.email,
      name: userPayload.firstName,
      gender: userPayload.gender,
      surname: userPayload.lastName,
      phone_number: userPayload.phone,
      city: userPayload.city,
      country: userPayload.country,
      gdpr_optin: userPayload.gdprOptin,
      email_optin: userPayload.emailOptin,
      sms_optin: userPayload.smsOptin,
      whatsapp_optin: userPayload.whatsappOptin,
      language: userPayload.language?.replace('-', '_'),
      custom: userPayload.custom
    }

    Object.keys(attributes).forEach((key) => {
      if (attributes[key as keyof typeof attributes] === undefined) {
        delete attributes[key as keyof typeof attributes]
      }
    })

    Object.keys(identifiers).forEach((key) => {
      if (identifiers[key as keyof typeof identifiers] === undefined) {
        delete identifiers[key as keyof typeof identifiers]
      }
    })

    return { identifiers, attributes }
  })

  return { users: batchPayload }
}

export function sendBulkTrackEvents(
  dataArray:
    | TrackEventPayload[]
    | CartViewedEventPayload[]
    | CheckoutEventPayload[]
    | OrderCompletedEventPayload[]
    | ProductAddedEventPayload[]
    | ProductListViewedEventPayload[]
    | productRemovedEventPayload[]
    | productViewedEventPayload[]
    | userRegisteredEventPayload[],
  event_name?: string
) {
  const bulkPayload: upsertUserPayload[] = []

  dataArray.forEach((data) => {
    const addEventParameters = function (
      event: insiderEvent,
      data:
        | {
            url?: string
            product_id?: string
            taxonomy?: string
            name?: string
            currency?: string
            variant_id?: number
            unit_sale_price?: number
            unit_price?: number
            quantity?: number
            product_image_url?: string
            event_group_id?: string
            referrer?: string
            user_agent?: string
            [p: string]: unknown
          }
        | undefined,
      parameter: string
    ) {
      parameter = parameter.toString().toLowerCase().trim().split(' ').join('_')

      if (parameter === 'taxonomy') {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        event.event_params[parameter] = [data[parameter]]
      } else if (defaultEvents.indexOf(parameter) > -1) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        event.event_params[parameter] = data[parameter]
      } else if (data) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        event.event_params.custom[parameter] = data[parameter]
      }

      return event
    }

    const identifiers = {
      uuid: data.uuid,
      custom: {
        segment_anonymous_id: data.segment_anonymous_id
      }
    }

    if (data.email_as_identifier && data?.attributes?.email) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      identifiers['email'] = data?.attributes?.email
    }

    if (data.phone_number_as_identifier && data?.attributes?.phone) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      identifiers['phone_number'] = data?.attributes?.phone
    }

    const payload: upsertUserPayload = {
      identifiers,
      attributes: {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        custom: {}
      },
      events: []
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
      'campaign_id',
      'campaign_name',
      'url',
      'product_id',
      'user_agent',
      'taxonomy',
      'name',
      'variant_id',
      'unit_sale_price',
      'unit_price',
      'quantity',
      'product_image_url',
      'event_group_id',
      'referrer',
      'currency'
    ]

    for (const key of Object.keys(data.attributes || {})) {
      const attributeName: string = key.toString().toLowerCase().trim().split(' ').join('_').toString()

      if (attributeName === 'locale' && data.attributes) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        payload.attributes[attributeName as keyof typeof payload.attributes] = data.attributes[attributeName]
          ?.split('-')
          .join('_')
      } else if (defaultAttributes.indexOf(attributeName) > -1 && data.attributes) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        payload.attributes[attributeName as keyof typeof payload.attributes] = data.attributes[attributeName]
      } else if (data.attributes) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        payload.attributes.custom[attributeName as keyof typeof payload.attributes.custom] =
          data.attributes[attributeName]
      }
    }

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const eventName = event_name || data.event_name.toString().toLowerCase().trim().split(' ').join('_').toString()

    let event: insiderEvent = {
      event_name: eventName,
      timestamp: data.timestamp.toString(),
      event_params: {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        custom: {}
      }
    }

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    for (const key of Object.keys(data.parameters || {})) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      event = addEventParameters(event, data.parameters, key)
    }

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    if (data.products) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      for (const product of data.products) {
        let productEvent = event

        for (const key of Object.keys(product || {})) {
          productEvent = addEventParameters(productEvent, product, key)
        }

        payload.events.push(productEvent)
      }
    } else {
      payload.events.push(event)
    }

    bulkPayload.push(payload)
  })

  return { users: bulkPayload }
}
